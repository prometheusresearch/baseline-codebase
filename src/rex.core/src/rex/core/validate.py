#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .error import Error, guard
import re
import os.path
import collections
import operator
import keyword
import weakref
import json
import yaml


class Location(object):
    """
    Position of a node in a YAML document.

    `filename`
        The path to the YAML document.
    `line`
        The line in the YAML document (zero-based).
    """

    __slots__ = ('filename', 'line')

    @classmethod
    def from_node(cls, node):
        return cls(node.start_mark.name, node.start_mark.line)

    def __init__(self, filename, line):
        self.filename = filename
        self.line = line

    def __str__(self):
        return "\"%s\", line %s" % (self.filename, self.line+1)

    def __repr__(self):
        return "%s(%r, %r)" % (self.__class__.__name__,
                               self.filename, self.line)


class LocationRef(weakref.ref):
    # Weak reference from a record to its location.

    __slots__ = ('oid', 'location')

    oid_to_ref = {}

    @staticmethod
    def cleanup(ref, oid_to_ref=oid_to_ref):
        del oid_to_ref[ref.oid]

    def __new__(cls, record, location):
        self = super(LocationRef, cls).__new__(cls, record, cls.cleanup)
        self.oid = id(record)
        self.location = location
        cls.oid_to_ref[self.oid] = self
        return self

    def __init__(self, record, location):
        super(LocationRef, self).__init__(record, self.cleanup)

    @classmethod
    def locate(cls, record):
        """
        Finds the record location.
        """
        ref = cls.oid_to_ref.get(id(record))
        if ref is not None:
            return ref.location

    @classmethod
    def set_location(cls, record, location):
        """
        Associates a record with its location.
        """
        if not isinstance(location, Location):
            location = cls.locate(location)
        if location is not None:
            cls(record, location)


set_location = LocationRef.set_location
locate = LocationRef.locate


BaseLoader = getattr(yaml, 'CSafeLoader', yaml.SafeLoader)
class ValidatingLoader(BaseLoader):
    # Customized YAML parser that uses validators to convert YAML nodes.

    def __init__(self, stream, validate, master=None):
        super(ValidatingLoader, self).__init__(stream)
        self.validate = validate
        self.validate_stack = []
        self.master = master

    def push_validate(self, validate):
        self.validate_stack.append(self.validate)
        self.validate = validate

    def pop_validate(self):
        self.validate = self.validate_stack.pop()

    def construct_object(self, node, deep=False):
        if self.validate is not None:
            return self.validate.construct(self, node)
        return super(ValidatingLoader, self).construct_object(node, deep)

    def __call__(self):
        try:
            return self.get_single_data()
        finally:
            self.dispose()


class Validate(object):
    """
    Validates and normalizes input values.
    """

    def __call__(self, data):
        """
        Applies the validator to the input value.

        Subclasses must override this method.
        """
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)

    def construct(self, loader, node):
        """
        Validates and converts a YAML node.

        Subclasses should override this method.
        """
        loader.push_validate(None)
        try:
            data = loader.construct_object(node, deep=True)
        finally:
            loader.pop_validate()
        location = Location.from_node(node)
        with guard("While parsing:", location):
            return self(data)

    def parse(self, stream, master=None):
        """
        Parses and validates a YAML document.

        `stream`
            A string or an open file containing a YAML document.
        `master`
            Optional controller object for the YAML loader.
        """
        loader = ValidatingLoader(stream, self, master)
        try:
            return loader()
        except yaml.YAMLError, exc:
            raise Error("Failed to parse a YAML document:", exc)

    def __repr__(self):
        return "%s()" % self.__class__.__name__


class AnyVal(Validate):
    """
    Accepts any input; returns it unchanged.
    """

    def __call__(self, data):
        return data


class MaybeVal(Validate):
    """
    Returns ``None`` if input is ``None``; otherwise applies `validate`.
    """

    def __init__(self, validate):
        self.validate = validate

    def __call__(self, data):
        if data is None:
            return None
        return self.validate(data)

    def construct(self, loader, node):
        if (isinstance(node, yaml.ScalarNode) and
                node.tag == u'tag:yaml.org,2002:null'):
            return None
        return self.validate.construct(loader, node)

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__, self.validate)


class OneOfVal(Validate):
    """
    Returns the value produced by the first successful validator from the
    `validates` list; raises an error if all validators fail.
    """

    def __init__(self, *validates):
        self.validates = validates

    def __call__(self, data):
        errors = []
        for validate in self.validates:
            try:
                return validate(data)
            except Error, error:
                errors.append(error)
        raise Error("Failed to match the value against any of the following:",
                    "\n\n".join(str(error) for error in errors))

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__,
                           ", ".join(str(validate)
                                     for validate in self.validates))


class StrVal(Validate):
    """
    Accepts Unicode and UTF-8 encoded 8-bit strings; returns an 8-bit string.

    If `pattern` is given, the whole input must match the pattern.
    """

    def __init__(self, pattern=None):
        self.pattern = pattern

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if not isinstance(data, (str, unicode)):
                raise Error("Expected a string")
            if isinstance(data, str):
                try:
                    data.decode('utf-8')
                except UnicodeDecodeError:
                    raise Error("Expected a valid UTF-8 string")
            if isinstance(data, unicode):
                data = data.encode('utf-8')
            if self.pattern is not None and \
                    re.match(r'\A(?:%s)\Z' % self.pattern, data) is None:
                raise Error("Expected a string matching:", "/%s/"
                            % self.pattern)
        return data

    def construct(self, loader, node):
        with guard("While parsing:", Location.from_node(node)):
            if not (isinstance(node, yaml.ScalarNode) and
                    node.tag == u'tag:yaml.org,2002:str'):
                error = Error("Expected a string")
                error.wrap("Got:", node.value
                                   if isinstance(node, yaml.ScalarNode)
                                   else "a %s" % node.id)
                raise error
            data = loader.construct_scalar(node)
            return self(data)

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__,
                           repr(self.pattern)
                                if self.pattern is not None else "")


class ChoiceVal(Validate):
    """
    Accepts strings from a fixed set of `choices`.
    """

    def __init__(self, *choices):
        self.choices = choices

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if not isinstance(data, (str, unicode)):
                raise Error("Expected a string")
            if isinstance(data, unicode):
                data = data.encode('utf-8')
            if data not in self.choices:
                raise Error("Expected one of:",
                            ", ".join(self.choices))
        return data

    def construct(self, loader, node):
        with guard("While parsing:", Location.from_node(node)):
            if not (isinstance(node, yaml.ScalarNode) and
                    node.tag == u'tag:yaml.org,2002:str'):
                error = Error("Expected a string")
                error.wrap("Got:", node.value
                                   if isinstance(node, yaml.ScalarNode)
                                   else "a %s" % node.id)
                raise error
            data = loader.construct_scalar(node)
            return self(data)

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__,
                           ", ".join(repr(choice) for choice in self.choices))


class BoolVal(Validate):
    """
    Accepts Boolean values.

    ``0``, ``''``, ``'0'``, ``'false'`` are accepted as ``False`` values.
    ``1``, ``'1'``, ``'true'`` are accepted as ``True`` values.
    """

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if data in [0, '', '0', 'false']:
                data = False
            if data in [1, '1', 'true']:
                data = True
            if not isinstance(data, bool):
                raise Error("Expected a Boolean value")
        return data

    def construct(self, loader, node):
        with guard("While parsing:", Location.from_node(node)):
            if not (isinstance(node, yaml.ScalarNode) and
                    node.tag == u'tag:yaml.org,2002:bool'):
                error = Error("Expected a Boolean value")
                error.wrap("Got:", node.value
                                   if isinstance(node, yaml.ScalarNode)
                                   else "a %s" % node.id)
                raise error
            return loader.construct_yaml_bool(node)


class IntVal(Validate):
    """
    Accepts an integer or a string of digits; returns an integer.

    If `min_bound` or `max_bound` are given, checks that the input is within
    the given boundaries.
    """

    def __init__(self, min_bound=None, max_bound=None):
        self.min_bound = min_bound
        self.max_bound = max_bound

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if isinstance(data, (str, unicode)):
                try:
                    data = int(data)
                except ValueError:
                    raise Error("Expected an integer")
            if not isinstance(data, (int, long)) or isinstance(data, bool):
                raise Error("Expected an integer")
            if not ((self.min_bound is None or self.min_bound <= data) and
                    (self.max_bound is None or self.max_bound >= data)):
                raise Error("Expected an integer in range:",
                            "[%s..%s]"
                            % (self.min_bound
                               if self.min_bound is not None else "",
                               self.max_bound
                               if self.max_bound is not None else ""))
        return data

    def construct(self, loader, node):
        with guard("While parsing:", Location.from_node(node)):
            if not (isinstance(node, yaml.ScalarNode) and
                    node.tag == u'tag:yaml.org,2002:int'):
                error = Error("Expected an integer")
                error.wrap("Got:", node.value
                                   if isinstance(node, yaml.ScalarNode)
                                   else "a %s" % node.id)
                raise error
            return self(loader.construct_yaml_int(node))

    def __repr__(self):
        args = []
        if self.min_bound is not None:
            args.append("min_bound=%s" % self.min_bound)
        if self.max_bound is not None:
            args.append("max_bound=%s" % self.max_bound)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class UIntVal(IntVal):
    """
    Accepts non-negative integers.
    """

    def __init__(self, max_bound=None):
        super(UIntVal, self).__init__(0, max_bound)

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__,
                           "max_bound=%s" % self.max_bound
                                if self.max_bound is not None else "")


class PIntVal(IntVal):
    """
    Accepts positive integers.
    """

    def __init__(self, max_bound=None):
        super(PIntVal, self).__init__(1, max_bound)

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__,
                           "max_bound=%s" % self.max_bound
                                if self.max_bound is not None else "")


class SeqVal(Validate):
    """
    Accepts lists or serialized JSON arrays.

    If set, `validate_item` is used to normalize list items.
    """

    def __init__(self, validate_item=None):
        self.validate_item = validate_item

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if isinstance(data, (str, unicode)):
                try:
                    data = json.loads(data)
                except ValueError:
                    raise Error("Expected a JSON array")
            if not isinstance(data, list):
                raise Error("Expected a sequence")
        items = []
        for idx, item in enumerate(data):
            if self.validate_item is not None:
                with guard("While validating sequence item", "#%s" % (idx+1)):
                    item = self.validate_item(item)
            items.append(item)
        return items

    def construct(self, loader, node):
        if not (isinstance(node, yaml.SequenceNode) and
                node.tag == u'tag:yaml.org,2002:seq'):
            error = Error("Expected a sequence")
            error.wrap("Got:", node.value
                               if isinstance(node, yaml.ScalarNode)
                               else "a %s" % node.id)
            error.wrap("While parsing:", Location.from_node(node))
            raise error
        loader.push_validate(self.validate_item)
        try:
            data = loader.construct_sequence(node, deep=True)
        finally:
            loader.pop_validate()
        return data

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__,
                           self.validate_item
                                if self.validate_item is not None else "")


class OneOrSeqVal(SeqVal):
    """
    Accepts a single item or a list of items.

    If set, `validate_item` is used to normalize the items.
    """

    def __call__(self, data):
        if isinstance(data, list):
            return super(OneOrSeqVal, self).__call__(data)
        return (self.validate_item(data)
                    if self.validate_item is not None else data)

    def construct(self, loader, node):
        if isinstance(node, yaml.SequenceNode):
            return super(OneOrSeqVal, self).construct(loader, node)
        loader.push_validate(self.validate_item)
        try:
            data = loader.construct_object(node, deep=True)
        finally:
            loader.pop_validate()
        return data


class MapVal(Validate):
    """
    Accepts dictionaries or serialized JSON objects.

    If set, `validate_key` and `validate_value` are used to normalize
    dictionary keys and values respectively.
    """

    def __init__(self, validate_key=None, validate_value=None):
        self.validate_key = validate_key
        self.validate_value = validate_value

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if isinstance(data, (str, unicode)):
                try:
                    data = json.loads(data)
                except ValueError:
                    raise Error("Expected a JSON object")
            if not isinstance(data, dict):
                raise Error("Expected a mapping")
        pairs = []
        for key in sorted(data):
            value = data[key]
            if self.validate_key is not None:
                with guard("While validating mapping key:", repr(key)):
                    key = self.validate_key(key)
            if self.validate_value is not None:
                with guard("While validating mapping value for key:",
                           repr(key)):
                    value = self.validate_value(value)
            pairs.append((key, value))
        return dict(pairs)

    def construct(self, loader, node):
        if not (isinstance(node, yaml.MappingNode) and
                node.tag == u'tag:yaml.org,2002:map'):
            error = Error("Expected a mapping")
            error.wrap("Got:", node.value
                               if isinstance(node, yaml.ScalarNode)
                               else "a %s" % node.id)
            error.wrap("While parsing:", Location.from_node(node))
            raise error
        data = {}
        for key_node, value_node in node.value:
            loader.push_validate(self.validate_key)
            try:
                key = loader.construct_object(key_node, deep=True)
            finally:
                loader.pop_validate()
            try:
                hash(key)
            except TypeError, exc:
                raise yaml.constructor.ConstructorError(
                        "while constructing a mapping",
                        node.start_mark,
                        "found an unacceptable key (%s)" % exc,
                        key_node.start_mark)
            if key in data:
                raise yaml.constructor.ConstructorError(
                        "while constructing a mapping",
                        node.start_mark,
                        "found a duplicate key",
                        key_node.start_mark)
            loader.push_validate(self.validate_value)
            try:
                value = loader.construct_object(value_node, deep=True)
            finally:
                loader.pop_validate()
            data[key] = value
        return data

    def __repr__(self):
        args = []
        if self.validate_key is not None or self.validate_value is not None:
            args.append(str(self.validate_key))
        if self.validate_value is not None:
            args.append(str(self.validate_value))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class OMapVal(MapVal):
    """
    Accepts a list of pairs or one-element dictionaries;
    returns ``OrderedDict`` object.

    If set, `validate_key` and `validate_value` are used to normalize
    dictionary keys and values respectively.
    """

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if isinstance(data, (str, unicode)):
                try:
                    data = json.loads(data,
                            object_pairs_hook=collections.OrderedDict)
                except ValueError:
                    raise Error("Expected a JSON object")
            if isinstance(data, collections.OrderedDict):
                data = data.items()
            if not (isinstance(data, list) and
                    all(isinstance(item, (list, tuple)) and len(item) == 2 or
                        isinstance(item, dict) and len(item) == 1
                        for item in data)):
                raise Error("Expected an ordered mapping")
        pairs = []
        for entry in data:
            if isinstance(entry, dict):
                key, value = entry.items()[0]
            else:
                key, value = entry
            if self.validate_key is not None:
                with guard("While validating mapping key:", repr(key)):
                    key = self.validate_key(key)
            if self.validate_value is not None:
                with guard("While validating mapping value for key:",
                           repr(key)):
                    value = self.validate_value(value)
            pairs.append((key, value))
        return collections.OrderedDict(pairs)

    def construct(self, loader, node):
        if not (isinstance(node, yaml.SequenceNode) and
                node.tag == u'tag:yaml.org,2002:seq'):
            error = Error("Expected an ordered mapping")
            error.wrap("Got:", node.value
                               if isinstance(node, yaml.ScalarNode)
                               else "a %s" % node.id)
            error.wrap("While parsing:", Location.from_node(node))
            raise error
        pairs = []
        for item_node in node.value:
            if not (isinstance(item_node, yaml.MappingNode) and
                    item_node.tag == u'tag:yaml.org,2002:map' and
                    len(item_node.value) == 1):
                error = Error("Expected an entry of an ordered mapping")
                error.wrap("Got:", item_node.value
                                   if isinstance(item_node, yaml.ScalarNode)
                                   else "a %s" % item_node.id)
                error.wrap("While parsing:", Location.from_node(item_node))
                raise error
            [[key_node, value_node]] = item_node.value
            loader.push_validate(self.validate_key)
            try:
                key = loader.construct_object(key_node, deep=True)
            finally:
                loader.pop_validate()
            try:
                hash(key)
            except TypeError, exc:
                raise yaml.constructor.ConstructorError(
                        "while constructing a mapping",
                        node.start_mark,
                        "found an unacceptable key (%s)" % exc,
                        key_node.start_mark)
            loader.push_validate(self.validate_value)
            try:
                value = loader.construct_object(value_node, deep=True)
            finally:
                loader.pop_validate()
            pairs.append((key, value))
        return collections.OrderedDict(pairs)


class Record(object):
    """
    Base class for records with a fixed set of fields.
    """

    # NOTE: cannot use named tuples because we need weak references.
    __slots__ = ('__weakref__',)
    _fields = ()

    @classmethod
    def make(cls, name, fields):
        """
        Generates a record class with the given fields.
        """
        name = name or cls.__name__
        bases = (cls,)
        members = {}
        members['__slots__'] = members['_fields'] = tuple(fields)
        return type(name, bases, members)

    def __init__(self, *args, **kwds):
        # Convert any keywords to positional arguments.
        args_tail = []
        for field in self._fields[len(args):]:
            if field not in kwds:
                raise TypeError("missing field %r" % field)
            else:
                args_tail.append(kwds.pop(field))
        args = args + tuple(args_tail)
        # Complain if there are any keywords left.
        if kwds:
            attr = sorted(kwds)[0]
            if any(field == attr for field in self._fields):
                raise TypeError("duplicate field %r" % attr)
            else:
                raise TypeError("unknown field %r" % attr)
        # Assign field values.
        if len(args) != len(self._fields):
            raise TypeError("expected %d arguments, got %d"
                            % (len(self._fields), len(args)))
        for arg, field in zip(args, self._fields):
            setattr(self, field, arg)

    def __iter__(self):
        # Provided so that ``tuple(self)`` works.
        for field in self._fields:
            yield getattr(self, field)

    def __len__(self):
        return len(self._fields)

    def __hash__(self):
        return hash(tuple(self))

    def __eq__(self, other):
        return (self.__class__ is other.__class__ and
                tuple(self) == tuple(other))

    def __ne__(self, other):
        return (self.__class__ is not other.__class__ or
                tuple(self) != tuple(other))

    def __repr__(self):
        # `<name>(<field>=<value>, ...)`
        return ("%s(%s)" %
                (self.__class__.__name__,
                 ", ".join("%s=%r" % (field, value)
                           for field, value in zip(self._fields, self))))


class RecordVal(Validate):
    """
    Accepts a dictionary with field values; returns ``namedtuple`` object.

    `fields`
        List of record fields, where each field is one of:

        * a pair of the field name and the field validator, for mandatory
          fields;
        * a triple of the field name, the validator and the default value,
          for optional fields.
    """

    def __init__(self, fields):
        self.fields = fields
        self.names = []
        self.attributes = {}
        self.validates = {}
        self.defaults = {}
        for field in fields:
            assert isinstance(field, tuple) and 2 <= len(field) <= 3, \
                "invalid field: %s" % repr(field)
            if len(field) == 2:
                name, validate = field
                self.names.append(name)
                self.validates[name] = validate
            else:
                name, validate, default = field
                self.names.append(name)
                self.validates[name] = validate
                self.defaults[name] = default
            attribute = name
            if keyword.iskeyword(attribute):
                attribute += '_'
            self.attributes[name] = attribute
        self.record_type = Record.make(None,
                [self.attributes[name] for name in self.names])

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if isinstance(data, (str, unicode)):
                try:
                    data = json.loads(data)
                except ValueError:
                    raise Error("Expected a JSON object")
            if (isinstance(data, (tuple, Record)) and
                    len(data) == len(self.fields)):
                if list(getattr(data, '_fields', self.names)) != self.names:
                    raise Error("Expected a record with fields:",
                                ", ".join(self.names))
                data = dict((name, value)
                            for name, value in zip(self.names, data))
            if not isinstance(data, dict):
                raise Error("Expected a mapping")
        values = {}
        for name in sorted(data):
            value = data[name]
            name = name.replace('-', '_').replace(' ', '_')
            if name not in self.names:
                raise Error("Got unexpected field:", name)
            attribute = self.attributes[name]
            values[attribute] = value
        for name in self.names:
            attribute = self.attributes[name]
            if attribute in values:
                validate = self.validates[name]
                with guard("While validating field:", name):
                    values[attribute] = validate(values[attribute])
            elif name in self.defaults:
                values[attribute] = self.defaults[name]
            else:
                raise Error("Missing mandatory field:", name)
        return self.record_type(**values)

    def construct(self, loader, node):
        location = Location.from_node(node)
        if not (isinstance(node, yaml.MappingNode) and
                node.tag == u'tag:yaml.org,2002:map'):
            error = Error("Expected a mapping")
            error.wrap("Got:", node.value
                               if isinstance(node, yaml.ScalarNode)
                               else "a %s" % node.id)
            error.wrap("While parsing:", location)
            raise error
        values = {}
        for key_node, value_node in node.value:
            loader.push_validate(StrVal())
            try:
                name = loader.construct_object(key_node, deep=True)
            finally:
                loader.pop_validate()
            name = name.replace('-', '_').replace(' ', '_')
            with guard("While parsing:", location):
                if name not in self.names:
                    raise Error("Got unexpected field:", name)
                if name in values:
                    raise Error("Got duplicate field:", name)
            loader.push_validate(self.validates[name])
            with guard("While validating field:", name):
                try:
                    value = loader.construct_object(value_node, deep=True)
                finally:
                    loader.pop_validate()
            attribute = self.attributes[name]
            values[attribute] = value
        for name in self.names:
            attribute = self.attributes[name]
            if attribute not in values:
                if name in self.defaults:
                    values[attribute] = self.defaults[name]
                else:
                    with guard("While parsing:", location):
                        raise Error("Missing mandatory field:", name)
        data = self.record_type(**values)
        set_location(data, location)
        return data

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__, self.fields)


class SwitchVal(Validate):
    """
    Accepts a record; applies a validator that matches the set of record
    fields.

    `validate_map`
        Dictionary that maps a field name to the respective validator.

    `validate_default`
        Validator to use when no other validator matches the record.
    """

    def __init__(self, validate_map, validate_default=None):
        self.validate_map = validate_map
        self.validate_default = validate_default

    def __call__(self, data):
        names = set()
        if isinstance(data, dict):
            names = set([key.replace('-', '_').replace(' ', '_')
                         for key in data
                         if isinstance(key, (str, unicode))])
        elif isinstance(data, (str, unicode)):
            try:
                mapping = json.loads(data)
            except ValueError:
                pass
            else:
                if isinstance(mapping, dict):
                    names = set([key.replace('-', '_').replace(' ', '_')
                                 for key in mapping])
        elif isinstance(data, (tuple, Record)):
            names = set(getattr(data, '_fields', []))
        for key in sorted(self.validate_map):
            if key in names:
                return self.validate_map[key](data)
        if self.validate_default is not None:
            return self.validate_default(data)
        error = Error("Cannot recognize a record")
        error.wrap("Got:", repr(data))
        raise error

    def construct(self, loader, node):
        location = Location.from_node(node)
        if not (isinstance(node, yaml.MappingNode) and
                node.tag == u'tag:yaml.org,2002:map'):
            if self.validate_default is not None:
                return self.validate_default.construct(loader, node)
            error = Error("Expected a mapping")
            error.wrap("Got:", node.value
                               if isinstance(node, yaml.ScalarNode)
                               else "a %s" % node.id)
            error.wrap("While parsing:", location)
            raise error
        for key in sorted(self.validate_map):
            for key_node, value_node in node.value:
                if not (isinstance(key_node, yaml.ScalarNode) and
                        key_node.tag == u'tag:yaml.org,2002:str'):
                    continue
                name = key_node.value.replace('-', '_').replace(' ', '_')
                if key == name:
                    return self.validate_map[key].construct(loader, node)
        if self.validate_default is not None:
            return self.validate_default.construct(loader, node)
        error = Error("Cannot recognize a record")
        error.wrap("While parsing:", location)
        raise error

    def __repr__(self):
        args = []
        args.append(str(self.validate_map))
        if self.validate_default is not None:
            args.append(str(self.validate_default))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


