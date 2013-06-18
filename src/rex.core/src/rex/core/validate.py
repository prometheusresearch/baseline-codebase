#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .error import Error, guard
import re
import os.path
import collections
import json


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

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__,
                           self.validate_item
                                if self.validate_item is not None else "")


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


class RecordVal(Validate):
    """
    Accepts a dictionary with field values; returns ``namedtuple`` object.

    ``fields``
        List of record fields, where each field is one of:

        * a pair of the field name and the field validator, for mandatory
          fields;
        * a triple of the field name, the validator and the default value,
          for optional fields.
    """

    def __init__(self, fields):
        self.fields = fields
        self.names = []
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
        self.record_type = collections.namedtuple('Record', self.names)

    def __call__(self, data):
        with guard("Got:", repr(data)):
            if isinstance(data, (str, unicode)):
                try:
                    data = json.loads(data)
                except ValueError:
                    raise Error("Expected a JSON object")
            if isinstance(data, tuple) and len(data) == len(self.fields):
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
            values[name] = value
        for name in self.names:
            if name in values:
                validate = self.validates[name]
                with guard("While validating field:", name):
                    values[name] = validate(values[name])
            elif name in self.defaults:
                values[name] = self.defaults[name]
            else:
                raise Error("Missing mandatory field:", name)
        return self.record_type(**values)

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__, self.fields)


