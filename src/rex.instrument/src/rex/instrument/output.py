#
# Copyright (c) 2015, Prometheus Research, LLC
#


import collections
import json

import yaml


__all__ = (
    'OrderedDict',
    'SortedDict',
    'TypedSortedDict',
    'DefinedOrderDict',
    'TypedDefinedOrderDict',
    'dump_yaml',
    'dump_json',

    'Instrument',
    'dump_instrument_yaml',
    'dump_instrument_json',
)


class OrderedDumper(yaml.Dumper):
    pass


def unicode_representer(dumper, ustr):
    return dumper.represent_scalar(
        'tag:yaml.org,2002:str',
        ustr,
    )


OrderedDumper.add_representer(unicode, unicode_representer)


def dict_representer(dumper, data):
    return dumper.represent_mapping(
        yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
        data.items()
    )


class OrderedDumperMetaclass(type):
    def __init__(cls, name, bases, dct):  # noqa
        super(OrderedDumperMetaclass, cls).__init__(name, bases, dct)
        OrderedDumper.add_representer(cls, dict_representer)


class OrderedDict(collections.OrderedDict):
    """
    A functional equivalent to ``collections.OrderedDict``.
    """

    __metaclass__ = OrderedDumperMetaclass


class SortedDict(dict):
    """
    A dictionary class that sorts its keys alphabetically.
    """

    __metaclass__ = OrderedDumperMetaclass

    def keys(self):
        return sorted(super(SortedDict, self).keys())

    def __iter__(self):
        return iter(self.keys())

    def items(self):
        return list(self.iteritems())

    def iteritems(self):
        for key in self:
            yield (key, self[key])


class TypedSortedDict(SortedDict):
    """
    A variety of the ``SortedDict`` class that automatically casts the value of
    all keys to the type specified on the ``subtype`` property.
    """

    #: The type to cast all values in the dictionary to.
    subtype = None

    def __init__(self, obj=None):
        super(TypedSortedDict, self).__init__(obj or {})
        for key in self:
            self[key] = self[key]

    def __setitem__(self, key, value):
        if self.subtype:
            # pylint: disable=E1102
            value = self.subtype(value)
        super(TypedSortedDict, self).__setitem__(key, value)


class DefinedOrderDict(SortedDict):
    """
    A dictionary class that orders its keys according to its ``order``
    property (any unnamed keys are then sorted alphabetically).
    """

    #: A list of key names in the order you want them to be output.
    order = []

    def keys(self):
        existing_keys = super(DefinedOrderDict, self).keys()
        keys = []
        for key in self.order:
            if key in existing_keys:
                keys.append(key)
        for key in existing_keys:
            if key not in self.order:
                keys.append(key)
        return keys


class TypedDefinedOrderDict(DefinedOrderDict):
    """
    A variety of the ``DefinedOrderDict`` class that provides for the automatic
    casting of values in the dictionary based on their key. This conversion is
    driven by the ``key_types`` property. E.g.::

        key_types = {
            'foo': SortedOrderDict,
            'bar': [SortedOrderDict],
        }
    """

    #: The mapping of key names to types. To indicate that the key should
    #: contain a list of casted values, place the type in a list with one
    # element.
    key_types = {}

    def __init__(self, obj=None):
        super(TypedDefinedOrderDict, self).__init__(obj or {})
        for key in self.key_types:
            if key in self:
                # Force an invokation of our __setitem__
                self[key] = self[key]

    def __setitem__(self, key, value):
        if key in self.key_types:
            type_ = self.key_types[key]
            if isinstance(type_, list):
                value = [
                    type_[0](val)
                    for val in value
                ]
            else:
                value = type_(value)
        super(TypedDefinedOrderDict, self).__setitem__(key, value)


def dump_yaml(data, pretty=False, **kwargs):
    """
    A convenience wrapper around ``yaml.dump`` that respects the ordering of
    keys in classes like ``OrderedDict``, ``SortedDict``, and
    ``DefinedOrderDict``.

    :param data: the object to encode in YAML
    :param pretty:
        whether or not the output should be indented in human-friendly ways
    :type pretty: boolean
    :returns: a YAML-encoded string
    """

    kwargs['Dumper'] = OrderedDumper
    kwargs['allow_unicode'] = True

    if pretty:
        kwargs['default_flow_style'] = False

    return yaml.dump(data, **kwargs).rstrip()


def dump_json(data, pretty=False, **kwargs):
    """
    A convenience wrapper around ``json.dumps`` that respects the ordering of
    keys in classes like ``OrderedDict``, ``SortedDict``, and
    ``DefinedOrderDict``.

    :param data: the object to encode in JSON
    :param pretty:
        whether or not the output should be indented in human-friendly ways
    :type pretty: boolean
    :returns: a JSON-encoded string
    """

    kwargs['ensure_ascii'] = False
    kwargs['sort_keys'] = False

    if pretty:
        kwargs['indent'] = 2
        kwargs['separators'] = (',', ': ')

    return json.dumps(data, **kwargs).encode('utf-8')


class MatrixRow(DefinedOrderDict):
    order = [
        'id',
        'description',
        'required',
    ]


class BoundConstraint(DefinedOrderDict):
    order = [
        'min',
        'max',
    ]


class InstrumentField(DefinedOrderDict):
    order = [
        'id',
        'description',
        'type',
        'required',
        'annotation',
        'explanation',
        'identifiable',
    ]

    def __init__(self, field=None):
        super(InstrumentField, self).__init__(field or {})
        if 'type' in self:
            self['type'] = self['type']

    def __setitem__(self, key, value):
        if key == 'type' and isinstance(value, dict):
            value = InstrumentType(value)
        super(InstrumentField, self).__setitem__(key, value)


class InstrumentType(TypedDefinedOrderDict):
    order = [
        'base',
        'range',
        'length',
        'pattern',
        'enumerations',
        'record',
        'columns',
        'rows',
    ]

    key_types = {
        'record': [InstrumentField],
        'columns': [InstrumentField],
        'length': BoundConstraint,
        'range': BoundConstraint,
        'rows': [MatrixRow],
    }


class InstrumentTypeCollection(TypedSortedDict):
    subtype = InstrumentType


class Instrument(TypedDefinedOrderDict):
    order = [
        'id',
        'version',
        'title',
        'description',
        'types',
        'record',
    ]

    key_types = {
        'version': str,
        'types': InstrumentTypeCollection,
        'record': [InstrumentField],
    }


def dump_instrument_yaml(instrument, **kwargs):
    """
    A convenience wrapper around ``dump_yaml`` that will take a standard,
    dictionary-based Common Instrument Definition and encode it in a standard
    way, with keys outputted in a human-friendly way.

    :param instrument: the Instrument to encode in YAML
    :type instrument: dict
    :returns: a YAML-encoded version of the Instrument
    """

    return dump_yaml(Instrument(instrument), **kwargs)


def dump_instrument_json(instrument, **kwargs):
    """
    A convenience wrapper around ``dump_json`` that will take a standard,
    dictionary-based Common Instrument Definition and encode it in a standard
    way, with keys outputted in a human-friendly way.

    :param instrument: the Instrument to encode in JSON
    :type instrument: dict
    :returns: a JSON-encoded version of the Instrument
    """

    return dump_json(Instrument(instrument), **kwargs)

