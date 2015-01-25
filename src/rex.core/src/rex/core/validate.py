#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from .error import Error, guard
import re
import os.path
import collections
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


class ValidatingLoader(getattr(yaml, 'CSafeLoader', yaml.SafeLoader)):
    """
    Validating YAML parser.

    `stream`
        Input stream or input string.
    `validate`
        Document validator.
    `master`
        Optional controller object.
    `open`
        Function used to open external files.
    """

    # Overrides YAML 1.1 implicit tags.
    yaml_implicit_resolvers = {}

    class ValidatingContext(object):
        # Sets the parser validator on the `with` block.

        def __init__(self, loader, validate):
            self.loader = loader
            self.validate = validate

        def __enter__(self):
            self.loader.validate_stack.append(self.loader.validate)
            self.loader.validate = self.validate

        def __exit__(self, exc_type, exc_value, exc_tb):
            self.loader.validate = self.loader.validate_stack.pop()

    def __init__(self, stream, validate, master=None, open=open):
        self.stream = stream
        self.validate = validate
        self.validate_stack = []
        self.master = master
        self.open = open
        super(ValidatingLoader, self).__init__(stream)
        # Needed to generate a `Mark` object below.  We can't get it directly
        # from a `CLoader` instance.
        self.stream_name = (self.name if hasattr(self, 'name')
                            else '<unicode string>' if isinstance(stream, unicode)
                            else '<byte string>' if isinstance(stream, str)
                            else getattr(stream, 'name', '<file>'))

    def validating(self, validate):
        """
        Overrides the current validator.  Use on a ``with`` block::

            with loader.validating(StrVal()):
                ...
        """
        return self.ValidatingContext(self, validate)

    def __call__(self):
        """
        Parses and validates a YAML document.
        """
        try:
            # Ensure the stream contains no or one YAML document; load it.
            node = self.get_single_node()
            # If the stream contain no documents, make a fake !!null document.
            if node is None:
                mark = yaml.Mark(self.stream_name, 0, 0, 0, None, None)
                node = yaml.ScalarNode(u"tag:yaml.org,2002:null", u"",
                                       mark, mark, u'')
            return self.construct_document(node)
        finally:
            self.dispose()

    def __iter__(self):
        """
        Parses and validates all documents in a YAML stream.
        """
        try:
            while self.check_data():
                yield self.get_data()
        finally:
            self.dispose()

    def construct_object(self, node, deep=False):
        if node.tag == u'!include':
            stream = self.include(node)
            loader = self.__class__(stream, self.validate,
                                    self.master, self.open)
            # Ensure the stream contains no or one YAML document; load it.
            node = loader.get_single_node()
            # If the stream contain no documents, make a fake !!null document.
            if node is None:
                mark = yaml.Mark(loader.stream_name, 0, 0, 0, None, None)
                node = yaml.ScalarNode(u"tag:yaml.org,2002:null", u"",
                                       mark, mark, u'')
            stream.close()
            return loader.construct_document(node)
        if node.tag == u'!include/str':
            with self.include(node) as stream:
                value = stream.read()
            node = yaml.ScalarNode(u"tag:yaml.org,2002:str", value,
                                   node.start_mark, node.end_mark, u'')
        if self.validate is not None:
            return self.validate.construct(self, node)
        return super(ValidatingLoader, self).construct_object(node, deep)

    def include(self, node):
        if not isinstance(node, yaml.ScalarNode):
            raise yaml.constructor.ConstructorError(None, None,
                    "expected a file name, but found %s" % node.id,
                    node.start_mark)
        if not node.value:
            raise yaml.constructor.ConstructorError(None, None,
                    "expected a file name, but found an empty node",
                    node.start_mark)
        basename = getattr(self.stream, 'name', None)
        filename = node.value.encode('utf-8')
        if not os.path.isabs(filename):
            if not basename:
                raise yaml.constructor.ConstructorError(None, None,
                        "unable to resolve relative path: %s" % filename,
                        node.start_mark)
            filename = os.path.join(os.path.dirname(basename), filename)
        try:
            stream = self.open(filename)
        except IOError:
            raise yaml.constructor.ConstructorError(None, None,
                    "unable to open file: %s" % filename, node.start_mark)
        return stream


# Set implicit tags based on YAML 1.2.
ValidatingLoader.add_implicit_resolver(
        u'tag:yaml.org,2002:bool',
        re.compile(ur'''^(?:true|True|TRUE|false|False|FALSE)$''', re.X),
        list(u'tTfF'))
ValidatingLoader.add_implicit_resolver(
        u'tag:yaml.org,2002:float',
        re.compile(ur'''^(?:[-+]?(?:[0-9][0-9]*)\.[0-9]*(?:[eE][-+][0-9]+)?
                    |\.[0-9]+(?:[eE][-+][0-9]+)?
                    |[-+]?\.(?:inf|Inf|INF)
                    |\.(?:nan|NaN|NAN))$''', re.X),
        list(u'-+0123456789.'))
ValidatingLoader.add_implicit_resolver(
        u'tag:yaml.org,2002:int',
        re.compile(ur'''^(?:[-+]?0b[0-1_]+
                    |[-+]?(?:[0-9]+)
                    |[-+]?0x[0-9a-fA-F]+)$''', re.X),
        list(u'-+0123456789'))
ValidatingLoader.add_implicit_resolver(
        u'tag:yaml.org,2002:null',
        re.compile(ur'''^(?: ~
                    |null|Null|NULL
                    | )$''', re.X),
        [u'~', u'n', u'N', u''])
ValidatingLoader.add_implicit_resolver(
        u'tag:yaml.org,2002:timestamp',
        re.compile(ur'''^(?:[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]
                    |[0-9][0-9][0-9][0-9] -[0-9][0-9]? -[0-9][0-9]?
                     (?:[Tt]|[ \t]+)[0-9][0-9]?
                     :[0-9][0-9] :[0-9][0-9] (?:\.[0-9]*)?
                     (?:[ \t]*(?:Z|[-+][0-9][0-9]?(?::[0-9][0-9])?))?)$''', re.X),
        list(u'0123456789'))


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
        with loader.validating(None):
            data = loader.construct_object(node, deep=True)
        location = Location.from_node(node)
        with guard("While parsing:", location):
            return self(data)

    def parse(self, stream, master=None, open=open, Loader=ValidatingLoader):
        """
        Parses and validates a YAML document.

        `stream`
            A string or an open file containing a YAML document.
        `master`
            Optional controller object for the YAML loader.
        `open`
            Function used to open external files.
        `Loader`
            YAML parser class.
        """
        loader = Loader(stream, self, master, open)
        try:
            return loader()
        except yaml.YAMLError, exc:
            raise Error("Failed to parse a YAML document:", exc)

    def parse_all(self, stream, master=None, open=open,
                  Loader=ValidatingLoader):
        """
        Parses and validates all documents in a YAML stream.

        `stream`
            A string or an open file containing a series of YAML documents.
        `master`
            Optional controller object for the YAML loader.
        `open`
            Function used to open external files.
        `Loader`
            YAML parser class.
        """
        loader = Loader(stream, self, master, open)
        try:
            for data in loader:
                yield data
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


class ProxyVal(Validate):
    """
    Permits validating recursive structures.

    `validate`
        Validator wrapped by the proxy.  You can set this validator
        after the proxy is constructed using :meth:`set`, which
        permits you to use the proxy when constructing the validator.
    """

    validate = None

    def set(self, validate):
        """Sets the validator for the proxy to wrap."""
        assert self.validate is None and validate is not None
        self.validate = validate

    def __nonzero__(self):
        """``True`` is the wrapped validator is set."""
        return (self.validate is not None)

    def __call__(self, data):
        assert self.validate is not None
        return self.validate(data)

    def construct(self, loader, node):
        assert self.validate is not None
        return self.validate.construct(loader, node)

    def __repr__(self):
        if self.validate is None:
            return "%s()" % self.__class__.__name__
        else:
            return "%s(%s(...))" % (self.__class__.__name__,
                                    self.validate.__class__.__name__)


class MaybeVal(Validate):
    """
    Returns ``None`` if input is ``None``; otherwise applies `validate`.
    """

    def __init__(self, validate):
        if isinstance(validate, type):
            validate = validate()
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

    *DEPRECATED:* use :class:`UnionVal`.
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

    pattern = None

    def __init__(self, pattern=None):
        # Allow to specify the pattern in a subclass.
        self.pattern = pattern or self.__class__.pattern

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
                                if self.pattern != self.__class__.pattern
                                else "")


class UStrVal(StrVal):
    """
    Accepts Unicode and UTF-8 encoded 8-bit strings; returns a Unicode string.
    """

    def __call__(self, data):
        data = super(UStrVal, self).__call__(data)
        return data.decode('utf-8')


class ChoiceVal(Validate):
    """
    Accepts strings from a fixed set of `choices`.
    """

    def __init__(self, *choices):
        if len(choices) == 1 and isinstance(choices[0], list):
            [choices] = choices
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


class UChoiceVal(ChoiceVal):
    """
    Accepts strings from a fixed set of `choices`; returns a Unicode string.
    """

    def __call__(self, data):
        data = super(UChoiceVal, self).__call__(data)
        return data.decode('utf-8')


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
        if isinstance(validate_item, type):
            validate_item = validate_item()
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
        if (isinstance(node, yaml.ScalarNode) and
                node.tag == u'tag:yaml.org,2002:null' and
                node.value == u''):
            return []
        if not (isinstance(node, yaml.SequenceNode) and
                node.tag == u'tag:yaml.org,2002:seq'):
            error = Error("Expected a sequence")
            error.wrap("Got:", node.value
                               if isinstance(node, yaml.ScalarNode)
                               else "a %s" % node.id)
            error.wrap("While parsing:", Location.from_node(node))
            raise error
        with loader.validating(self.validate_item):
            data = loader.construct_sequence(node, deep=True)
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
        with loader.validating(self.validate_item):
            data = loader.construct_object(node, deep=True)
        return data


class MapVal(Validate):
    """
    Accepts dictionaries or serialized JSON objects.

    If set, `validate_key` and `validate_value` are used to normalize
    dictionary keys and values respectively.
    """

    def __init__(self, validate_key=None, validate_value=None):
        if isinstance(validate_key, type):
            validate_key = validate_key()
        if isinstance(validate_value, type):
            validate_value = validate_value()
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
        if (isinstance(node, yaml.ScalarNode) and
                node.tag == u'tag:yaml.org,2002:null' and
                node.value == u''):
            return {}
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
            with loader.validating(self.validate_key):
                key = loader.construct_object(key_node, deep=True)
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
            with loader.validating(self.validate_value):
                value = loader.construct_object(value_node, deep=True)
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
        if (isinstance(node, yaml.ScalarNode) and
                node.tag == u'tag:yaml.org,2002:null' and
                node.value == u''):
            return collections.OrderedDict()
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
            with loader.validating(self.validate_key):
                key = loader.construct_object(key_node, deep=True)
            try:
                hash(key)
            except TypeError, exc:
                raise yaml.constructor.ConstructorError(
                        "while constructing a mapping",
                        node.start_mark,
                        "found an unacceptable key (%s)" % exc,
                        key_node.start_mark)
            with loader.validating(self.validate_value):
                value = loader.construct_object(value_node, deep=True)
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

    def __clone__(self, **kwds):
        """
        Makes a copy of the record with new values for the given fields.
        """
        if not kwds:
            return self
        args = []
        for field in self._fields:
            arg = kwds.pop(field, getattr(self, field))
            args.append(arg)
        if kwds:
            attr = sorted(kwds)[0]
            raise TypeError("unknown field %r" % attr)
        clone = self.__class__(*args)
        set_location(clone, self)
        return clone

    def __getitem__(self, key):
        index = key
        if not isinstance(index, int):
            try:
                index = self._fields.index(key)
            except ValueError:
                raise KeyError(key)
        return getattr(self, self._fields[index])

    def _asdict(self):
        return collections.OrderedDict((field, getattr(self, field))
                                       for field in self._fields)

    __dict__ = property(_asdict)

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


class RecordField(object):
    """
    Describes a field of a record for use with :class:`RecordVal`.

    `name`
        The name of the field.
    `validate`
        Field type.
    `default`
        The default value; ``NotImplemented`` if the field is mandatory.
    `attribute`
        Normalized name that could be used as a Python attribute.
    `has_default`
        ``True`` if the field is optional; ``False`` otherwise.
    """

    def __init__(self, name, validate, default=NotImplemented):
        attribute = name
        if keyword.iskeyword(attribute):
            attribute += '_'
        if isinstance(validate, type):
            validate = validate()
        has_default = (default is not NotImplemented)
        self.attribute = attribute
        self.name = name
        self.validate = validate
        self.default = default
        self.has_default = has_default

    def __repr__(self):
        if self.has_default:
            return repr((self.name, self.validate, self.default))
        else:
            return repr((self.name, self.validate))


class RecordVal(Validate):
    """
    Accepts a dictionary with field values; returns ``namedtuple`` object.

    `fields`
        List of record fields, where each field is one of:

        * a :class:`RecordField` object;
        * a pair of the field name and the field validator, for mandatory
          fields;
        * a triple of the field name, the validator and the default value,
          for optional fields.
    """

    def __init__(self, *fields):
        if len(fields) == 1 and isinstance(fields[0], list):
            [fields] = fields
        self.fields = collections.OrderedDict()
        for field in fields:
            if isinstance(field, tuple):
                field = RecordField(*field)
            assert isinstance(field, RecordField), field
            assert field.name not in self.fields, field
            self.fields[field.name] = field
        self.record_type = Record.make(None,
                [field.attribute for field in self.fields.values()])

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if isinstance(data, (str, unicode)):
                try:
                    data = json.loads(data)
                except ValueError:
                    raise Error("Expected a JSON object")
            if (isinstance(data, (tuple, Record)) and
                    len(data) == len(self.fields)):
                fields = self.record_type._fields
                if getattr(data, '_fields', fields) != fields:
                    raise Error("Expected a record with fields:",
                                ", ".join(self.fields.keys()))
                data = dict((field.name, value)
                            for field, value in zip(self.fields.values(), data)
                            if not field.has_default or value != field.default)
            if not isinstance(data, dict):
                raise Error("Expected a mapping")
        values = {}
        for name in sorted(data):
            value = data[name]
            name = name.replace('-', '_').replace(' ', '_')
            if name not in self.fields:
                raise Error("Got unexpected field:", name)
            attribute = self.fields[name].attribute
            values[attribute] = value
        for field in self.fields.values():
            attribute = field.attribute
            if attribute in values:
                validate = field.validate
                with guard("While validating field:", field.name):
                    values[attribute] = validate(values[attribute])
            elif field.has_default:
                values[attribute] = field.default
            else:
                raise Error("Missing mandatory field:", field.name)
        return self.record_type(**values)

    def construct(self, loader, node):
        location = Location.from_node(node)
        if (isinstance(node, yaml.ScalarNode) and
                node.tag == u'tag:yaml.org,2002:null' and
                node.value == u'' and
                all(field.has_default for field in self.fields.values())):
            values = {}
            for field in self.fields.values():
                values[field.attribute] = field.default
            data = self.record_type(**values)
            set_location(data, location)
            return data
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
            with loader.validating(StrVal()):
                name = loader.construct_object(key_node, deep=True)
            name = name.replace('-', '_').replace(' ', '_')
            with guard("While parsing:", Location.from_node(key_node)):
                if name not in self.fields:
                    raise Error("Got unexpected field:", name)
                if name in values:
                    raise Error("Got duplicate field:", name)
            field = self.fields[name]
            with guard("While validating field:", name), \
                 loader.validating(field.validate):
                value = loader.construct_object(value_node, deep=True)
            values[field.attribute] = value
        for field in self.fields.values():
            attribute = field.attribute
            if attribute not in values:
                if field.has_default:
                    values[attribute] = field.default
                else:
                    with guard("While parsing:", location):
                        raise Error("Missing mandatory field:", field.name)
        data = self.record_type(**values)
        set_location(data, location)
        return data

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__,
                           ", ".join(repr(field)
                                     for field in self.fields.values()))


class SwitchVal(Validate):
    """
    Accepts a record; applies a validator that matches the set of record
    fields.

    `validate_map`
        Dictionary that maps a field name to the respective validator.

    `validate_default`
        Validator to use when no other validator matches the record.

    *DEPRECATED:* use :class:`UnionVal`.
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


class OnMatch(object):
    """
    Matches the input value against some condition.
    """

    def __call__(self):
        """
        Performs the test on the given value.

        Subclasses must override this method.
        """
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)

    def __str__(self):
        """
        A textual description of the test; used for error messages.

        Subclasses must override this method.
        """
        raise NotImplementedError("%s.__str__()" % self.__class__.__name__)

    def __repr__(self):
        return "%s()" % self.__class__.__name__


class OnScalar(OnMatch):
    """
    Tests if the input is a scalar value.
    """

    def __call__(self, data):
        return (data is None or
                isinstance(data, (str, unicode, bool, int, long)) or
                isinstance(data, yaml.ScalarNode))

    def __str__(self):
        return "scalar"


class OnSeq(OnMatch):
    """
    Tests if the input is a sequence.
    """

    def __call__(self, data):
        return (isinstance(data, list) or
                isinstance(data, yaml.SequenceNode))

    def __str__(self):
        return "sequence"


class OnMap(OnMatch):
    """
    Tests if the input is a mapping.
    """

    def __call__(self, data):
        return (isinstance(data, dict) or
                isinstance(data, yaml.MappingNode))

    def __str__(self):
        return "mapping"


class OnField(OnMatch):
    """
    Tests if the input has a field with the given name.
    """

    def __init__(self, name):
        self.name = name

    def __call__(self, data):
        keys = []
        if isinstance(data, (str, unicode)):
            try:
                mapping = json.loads(data)
            except ValueError:
                pass
            else:
                if isinstance(mapping, dict):
                    data = mapping
        if isinstance(data, dict):
            keys = [key for key in data if isinstance(key, (str, unicode))]
        elif isinstance(data, (tuple, Record)):
            keys = getattr(data, '_fields', [])
        elif (isinstance(data, yaml.MappingNode) and
                data.tag == u'tag:yaml.org,2002:map'):
            keys = [key_node.value
                    for key_node, value_node in data.value
                    if isinstance(key_node, yaml.ScalarNode) and
                        key_node.tag == u'tag:yaml.org,2002:str']
        return any(key.replace('-', '_').replace(' ', '_') == self.name
                   for key in keys)

    def __str__(self):
        return "%s record" % self.name

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.name)


class UnionVal(Validate):
    """
    Checks the value against a given set of tests; returns the value
    produced by the validator associated with the first successful test;
    raises an error if all tests fail.

    `variants`
        List of pairs of a test and a validator.  If the test is omitted
        or ``None``, it always succeeds.  If the test is a string,
        a :class:`OnField` test is assumed.
    """

    def __init__(self, *variants):
        if len(variants) == 1 and isinstance(variants[0], list):
            [variants] = variants
        self.variants = []
        for variant in variants:
            if isinstance(variant, tuple) and len(variant) == 2:
                match, validate = variant
            else:
                match = None
                validate = variant
            if isinstance(match, (str, unicode)):
                match = OnField(match)
            if isinstance(match, type):
                match = match()
            if isinstance(validate, type):
                validate = validate()
            self.variants.append((match, validate))

    def __call__(self, data):
        for match, validate in self.variants:
            if match is None or match(data):
                return validate(data)
        error = Error("Expected one of:",
                      "\n".join(str(match)
                                for match, validate in self.variants))
        error.wrap("Got:", repr(data))
        raise error

    def construct(self, loader, node):
        for match, validate in self.variants:
            if match is None or match(node):
                return validate.construct(loader, node)
        error = Error("Expected one of:",
                      "\n".join(str(match)
                                for match, validate in self.variants))
        error.wrap("Got:", node.value
                           if isinstance(node, yaml.ScalarNode)
                           else "a %s" % node.id)
        error.wrap("While parsing:", Location.from_node(node))
        raise error

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__,
                           ", ".join(repr(variant)
                                     for variant in self.variants))


