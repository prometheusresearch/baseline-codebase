#
# Copyright (c) 2015, Prometheus Research, LLC
#


import collections
import json

import yaml


__all__ = (
    'OrderedDict',
    'SortedDict',
    'DefinedOrderDict',
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

    return json.dumps(data, **kwargs)


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

    def __init__(self, field):
        super(InstrumentField, self).__init__(field)
        if 'type' in self and isinstance(self['type'], dict):
            self['type'] = InstrumentType(self['type'])


class InstrumentType(DefinedOrderDict):
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

    def __init__(self, definition):
        super(InstrumentType, self).__init__(definition)
        for field in ('record', 'columns'):
            if field in self:
                self[field] = [
                    InstrumentField(fld)
                    for fld in self[field]
                ]
        for field in ('length', 'range'):
            if field in self:
                self[field] = BoundConstraint(self[field])
        if 'rows' in self:
            self['rows'] = [
                MatrixRow(row)
                for row in self['rows']
            ]


class InstrumentTypeCollection(SortedDict):
    def __init__(self, types):
        super(InstrumentTypeCollection, self).__init__(types)
        for name, defn in self.iteritems():
            self[name] = InstrumentType(defn)


class Instrument(DefinedOrderDict):
    order = [
        'id',
        'version',
        'title',
        'description',
        'types',
        'record',
    ]

    def __init__(self, instrument):
        super(Instrument, self).__init__(instrument)
        if 'types' in self:
            self['types'] = InstrumentTypeCollection(self['types'])
        if 'record' in self:
            self['record'] = [
                InstrumentField(field)
                for field in self['record']
            ]


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

