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

    def __call__(self, value):
        """
        Applies the validator to the value.

        Subclasses must override this method.
        """
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)

    def __repr__(self):
        return "%s()" % self.__class__.__name__


class AnyVal(Validate):
    """
    Accepts any input; returns it unchanged.
    """

    def __call__(self, value):
        return value


class MaybeVal(Validate):
    """
    Returns ``None`` if input is ``None``; otherwise applies `validate`.
    """

    def __init__(self, validate):
        self.validate = validate

    def __call__(self, value):
        if value is None:
            return None
        return self.validate(value)

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__, self.validate)


class OneOfVal(Validate):
    """
    Returns the value produced by the first successful validator from the
    `validates` list; raises an error if all validators fail.
    """

    def __init__(self, *validates):
        self.validates = validates

    def __call__(self, value):
        errors = []
        for validate in self.validates:
            try:
                return validate(value)
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

    def __call__(self, value):
        with guard("Got:", repr(value)):
            if not isinstance(value, (str, unicode)):
                raise Error("Expected a string")
            if isinstance(value, str):
                try:
                    value.decode('utf-8')
                except UnicodeDecodeError:
                    raise Error("Expected a valid UTF-8 string")
            if isinstance(value, unicode):
                value = value.encode('utf-8')
            if self.pattern is not None and \
                    re.match(r'\A(?:%s)\Z' % self.pattern, value) is None:
                raise Error("Expected a string matching:", "/%s/"
                            % self.pattern)
        return value

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

    def __call__(self, value):
        with guard("Got:", repr(value)):
            if not isinstance(value, (str, unicode)):
                raise Error("Expected a string")
            if isinstance(value, unicode):
                value = value.encode('utf-8')
            if value not in self.choices:
                raise Error("Expected one of:",
                            ", ".join(self.choices))
        return value

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__,
                           ", ".join(repr(choice) for choice in self.choices))


class BoolVal(Validate):
    """
    Accepts Boolean values.

    ``0``, ``''``, ``'0'``, ``'false'`` are accepted as ``False`` values.
    ``1``, ``'1'``, ``'true'`` are accepted as ``True`` values.
    """

    def __call__(self, value):
        with guard("Got:", repr(value)):
            if value in [0, '', '0', 'false']:
                value = False
            if value in [1, '1', 'true']:
                value = True
            if not isinstance(value, bool):
                raise Error("Expected a Boolean value")
        return value


class IntVal(Validate):
    """
    Accepts an integer or a string of digits; returns an integer.

    If `min_bound` or `max_bound` are given, checks that the input is within
    the given boundaries.
    """

    def __init__(self, min_bound=None, max_bound=None):
        self.min_bound = min_bound
        self.max_bound = max_bound

    def __call__(self, value):
        with guard("Got:", repr(value)):
            if isinstance(value, (str, unicode)):
                try:
                    value = int(value)
                except ValueError:
                    raise Error("Expected an integer")
            if not isinstance(value, (int, long)) or isinstance(value, bool):
                raise Error("Expected an integer")
            if not ((self.min_bound is None or self.min_bound <= value) and
                    (self.max_bound is None or self.max_bound >= value)):
                raise Error("Expected an integer in range:",
                            "[%s..%s]"
                            % (self.min_bound
                               if self.min_bound is not None else "",
                               self.max_bound
                               if self.max_bound is not None else ""))
        return value

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

    def __call__(self, value):
        with guard("Got:", repr(value)):
            if isinstance(value, (str, unicode)):
                try:
                    value = json.loads(value)
                except ValueError:
                    raise Error("Expected a JSON array")
            if not isinstance(value, list):
                raise Error("Expected a sequence")
        items = []
        for idx, item in enumerate(value):
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

    If set, `validate_key` and `validate_item` are used to normalize dictionary
    keys and values respectively.
    """

    def __init__(self, validate_key=None, validate_item=None):
        self.validate_key = validate_key
        self.validate_item = validate_item

    def __call__(self, value):
        with guard("Got:", repr(value)):
            if isinstance(value, (str, unicode)):
                try:
                    value = json.loads(value)
                except ValueError:
                    raise Error("Expected a JSON object")
            if not isinstance(value, dict):
                raise Error("Expected a mapping")
        pairs = []
        for key in sorted(value):
            item = value[key]
            if self.validate_key is not None:
                with guard("While validating mapping key:", repr(key)):
                    key = self.validate_key(key)
            if self.validate_item is not None:
                with guard("While validating mapping value for key:",
                           repr(key)):
                    item = self.validate_item(item)
            pairs.append((key, item))
        return dict(pairs)

    def __repr__(self):
        args = []
        if self.validate_key is not None or self.validate_item is not None:
            args.append(str(self.validate_key))
        if self.validate_item is not None:
            args.append(str(self.validate_item))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class OMapVal(MapVal):
    """
    Accepts a list of pairs or one-element dictionaries;
    returns ``OrderedDict`` object.

    If set, `validate_key` and `validate_item` are used to normalize dictionary
    keys and values respectively.
    """

    def __call__(self, value):
        with guard("Got:", repr(value)):
            if isinstance(value, (str, unicode)):
                try:
                    value = json.loads(value,
                            object_pairs_hook=collections.OrderedDict)
                except ValueError:
                    raise Error("Expected a JSON object")
            if isinstance(value, collections.OrderedDict):
                value = value.items()
            if not (isinstance(value, list) and
                    all(isinstance(item, (list, tuple)) and len(item) == 2 or
                        isinstance(item, dict) and len(item) == 1
                        for item in value)):
                raise Error("Expected an ordered mapping")
        pairs = []
        for entry in value:
            if isinstance(entry, dict):
                key, item = entry.items()[0]
            else:
                key, item = entry
            if self.validate_key is not None:
                with guard("While validating mapping key:", repr(key)):
                    key = self.validate_key(key)
            if self.validate_item is not None:
                with guard("While validating mapping value for key:",
                           repr(key)):
                    item = self.validate_item(item)
            pairs.append((key, item))
        return collections.OrderedDict(pairs)


class FileVal(Validate):
    """
    Accepts a path to an existing file.
    """

    def __call__(self, value):
        with guard("Got:", repr(value)):
            if not isinstance(value, (str, unicode)):
                raise Error("Expected a string")
        if isinstance(value, unicode):
            value = value.encode('utf-8')
        if not os.path.isfile(value):
            raise Error("Cannot find file:", value)
        return value


class DirectoryVal(Validate):
    """
    Accepts a path to an existing directory.
    """

    def __call__(self, value):
        with guard("Got:", repr(value)):
            if not isinstance(value, (str, unicode)):
                raise Error("Expected a string")
        if isinstance(value, unicode):
            value = value.encode('utf-8')
        if not os.path.isdir(value):
            raise Error("Cannot find directory:", value)
        return value


