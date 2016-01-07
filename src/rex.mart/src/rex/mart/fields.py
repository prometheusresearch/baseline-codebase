#
# Copyright (c) 2015, Prometheus Research, LLC
#


import json

from copy import deepcopy
from types import NoneType
from decimal import Decimal
from datetime import date, time, datetime

from htsql.core.domain import BooleanDomain, IntegerDomain, FloatDomain, \
    DecimalDomain, TextDomain, EnumDomain, DateDomain, TimeDomain, \
    DateTimeDomain, OpaqueDomain, IdentityDomain, ID
from htsql_rex_deploy.domain import JSONDomain
from rex.core import Error
from rex.restful.serializer import RestfulJSONEncoder

from .util import make_safe_token


__all__ = (
    'SimpleField',
    'JsonField',
    'TextField',
    'IntegerField',
    'FloatField',
    'BooleanField',
    'DateField',
    'TimeField',
    'DateTimeField',
    'EnumerationField',
    'EnumerationSetField',
    'make_field',
    'make_field_from_htsql',
    'merge_field_into',
)


class SimpleField(object):
    name = None
    target_type = None
    version_mapping = None
    type_mapping = None
    default_coercers = None

    @classmethod
    def merge(cls, current, incoming):
        field = cls(current.name)
        field.version_mapping = deepcopy(current.version_mapping)
        field.version_mapping.update(incoming.version_mapping)
        return field

    def __init__(self, name, instrument_version=None):
        self.name = unicode(name)
        self._target_name = make_safe_token(name)
        self._forced_target_name = None
        self.version_mapping = {}
        if instrument_version:
            self.version_mapping[instrument_version] = self.target_type

    @property
    def target_name(self):
        return self._forced_target_name or self._target_name

    def force_target_name(self, name):
        self._forced_target_name = name

    def map_assessment_value(self, value, instrument_version):
        if value['value'] is None:
            return None

        original_type = self.version_mapping.get(instrument_version)
        if not original_type:
            raise Error('Unknown InstrumentVersion encountered')
        castor = self.type_mapping.get(original_type)
        if not castor:  # pragma: no coverage
            raise Error(
                'Cannot cast value to type "%s": %r' % (
                    self.target_type,
                    value,
                )
            )
        return castor(value['value'])

    def default_coercion(self, value):
        coercer = self.default_coercers.get(type(value), None)
        if not coercer:
            raise Error(
                'Cannot cast value to type "%s": %r' % (
                    self.target_type,
                    value,
                )
            )

        try:
            return coercer(value)
        except Exception:
            raise Error(
                'Cannot cast value to type "%s": %r' % (
                    self.target_type,
                    value,
                )
            )

    def get_value_mapping(self, value, instrument_version=None):
        if instrument_version:
            value = self.map_assessment_value(value, instrument_version)
        return {
            self.target_name: self.default_coercion(value),
        }

    def get_deploy_facts(self, table_name):
        return [{
            'column': self.target_name,
            'of': table_name,
            'type': self.target_type.lower(),
            'required': False,
        }]

    def __repr__(self):  # pragma: no cover
        return '%s(%r)' % (
            self.__class__.__name__,
            self.name,
        )


class JsonField(SimpleField):
    target_type = 'json'
    default_coercers = {}

    def get_value_mapping(self, value, instrument_version=None):
        return {
            self.target_name: json.dumps(value, cls=RestfulJSONEncoder),
        }


class TextField(SimpleField):
    target_type = 'text'
    type_mapping = {
        'text': unicode,
        'integer': unicode,
        'float': unicode,
        'boolean': lambda x: u'TRUE' if x else u'FALSE',
        'date': unicode,
        'time': unicode,
        'dateTime': unicode,
        'enumeration': unicode,
    }
    default_coercers = {
        NoneType: lambda x: None,
        str: unicode,
        unicode: lambda x: x,
        int: unicode,
        float: unicode,
        Decimal: unicode,
        bool: lambda x: u'TRUE' if x else u'FALSE',
        date: lambda x: unicode(x.isoformat()),
        time: lambda x: unicode(x.replace(microsecond=0).isoformat()),
        datetime: lambda x: unicode(x.replace(microsecond=0).isoformat()),
    }

    def default_coercion(self, value):
        if isinstance(value, ID):
            return unicode(value)
        return super(TextField, self).default_coercion(value)


class IntegerField(SimpleField):
    target_type = 'integer'
    type_mapping = {
        'integer': lambda x: x,
        'float': int,
        'boolean': lambda x: 1 if x else 0,
    }
    default_coercers = {
        NoneType: lambda x: None,
        str: int,
        unicode: int,
        int: lambda x: x,
        float: int,
        Decimal: int,
        bool: lambda x: 1 if x else 0,
    }


class FloatField(SimpleField):
    target_type = 'float'
    type_mapping = {
        'float': lambda x: x,
        'integer': float,
        'boolean': lambda x: 1.0 if x else 0.0,
    }
    default_coercers = {
        NoneType: lambda x: None,
        str: float,
        unicode: float,
        int: float,
        float: lambda x: x,
        Decimal: float,
        bool: lambda x: 1.0 if x else 0.0,
    }


class BooleanField(SimpleField):
    target_type = 'boolean'
    type_mapping = {
        'boolean': lambda x: x,
    }
    default_coercers = {
        NoneType: lambda x: None,
        str: lambda x: True if x else False,
        unicode: lambda x: True if x else False,
        int: lambda x: True if x else False,
        float: lambda x: True if x else False,
        Decimal: lambda x: True if x else False,
        bool: lambda x: x,
    }


class DateField(SimpleField):
    target_type = 'date'
    type_mapping = {
        'date': lambda x: x,
    }
    default_coercers = {
        NoneType: lambda x: None,
        str: lambda x: datetime.strptime(x, '%Y-%m-%d').date(),
        unicode: lambda x: datetime.strptime(x, '%Y-%m-%d').date(),
        date: lambda x: x,
        datetime: lambda x: x.date(),
    }


class TimeField(SimpleField):
    target_type = 'time'
    type_mapping = {
        'time': lambda x: x,
    }
    default_coercers = {
        NoneType: lambda x: None,
        str: lambda x: datetime.strptime(x, '%H:%M:%S').time(),
        unicode: lambda x: datetime.strptime(x, '%H:%M:%S').time(),
        time: lambda x: x,
        datetime: lambda x: x.time(),
    }


class DateTimeField(SimpleField):
    target_type = 'dateTime'
    type_mapping = {
        'dateTime': lambda x: x,
        'date': lambda x: '%sT00:00:00' % (x,),
    }
    default_coercers = {
        NoneType: lambda x: None,
        str: lambda x: datetime.strptime(x, '%Y-%m-%dT%H:%M:%S'),
        unicode: lambda x: datetime.strptime(x, '%Y-%m-%dT%H:%M:%S'),
        date: lambda x: datetime(x.year, x.month, x.day),
        datetime: lambda x: x,
    }


class EnumerationField(TextField):
    target_type = 'enumeration'
    type_mapping = {
        'enumeration': lambda x: x,
    }
    enumerations = None

    @classmethod
    def merge(cls, current, incoming):
        field = super(EnumerationField, cls).merge(
            current,
            incoming,
        )
        field.enumerations = []

        for previous in (current, incoming):
            if isinstance(previous, EnumerationField):
                for enum in getattr(previous, 'enumerations', []):
                    if enum not in field.enumerations:
                        field.enumerations.append(enum)

        return field

    def __init__(self, name, instrument_version=None, enumerations=None):
        super(EnumerationField, self).__init__(
            name,
            instrument_version=instrument_version,
        )
        if enumerations:
            self.enumerations = enumerations or []

    def default_coercion(self, value):
        coerced = super(EnumerationField, self).default_coercion(value)
        if coerced not in self.enumerations and coerced is not None:
            raise Error(
                'Cannot cast value to type "%s(%s): %r' % (
                    self.target_type,
                    ','.join(self.enumerations),
                    value,
                )
            )
        return coerced

    def get_deploy_facts(self, table_name):
        facts = super(EnumerationField, self).get_deploy_facts(table_name)
        facts[0]['type'] = self.enumerations
        return facts


class EnumerationSetField(EnumerationField):
    target_type = 'enumerationSet'
    type_mapping = {
        'enumerationSet': lambda x: x,
        'enumeration': lambda x: [x],
    }
    default_coercers = {
        NoneType: lambda x: None,
        str: lambda x: [unicode(x)],
        unicode: lambda x: [x],
        int: lambda x: [unicode(x)],
        float: lambda x: [unicode(x)],
        Decimal: lambda x: [unicode(x)],
        bool: lambda x: [u'TRUE' if x else u'FALSE'],
        date: lambda x: [unicode(x.isoformat())],
        time: lambda x: [unicode(x.replace(microsecond=0).isoformat())],
        datetime: lambda x: [unicode(x.replace(microsecond=0).isoformat())],
        list: lambda x: x,
        tuple: list,
    }

    def get_enum_target_name(self, enum):
        return '%s_%s' % (self.target_name, enum)

    def get_deploy_facts(self, table_name):
        return [
            {
                'column': self.get_enum_target_name(enum),
                'of': table_name,
                'type': 'boolean',
                'default': False,
                'required': False,
            }
            for enum in self.enumerations
        ]

    def default_coercion(self, value):
        # pylint: disable=bad-super-call
        coerced = super(EnumerationField, self).default_coercion(value)
        if coerced is not None:
            for enum in coerced:
                if enum not in self.enumerations:
                    raise Error(
                        'Cannot cast value to type "%s(%s): %r' % (
                            self.target_type,
                            ','.join(self.enumerations),
                            value,
                        )
                    )
        return coerced

    def get_value_mapping(self, value, instrument_version=None):
        if instrument_version:
            value = self.map_assessment_value(value, instrument_version)
        value = self.default_coercion(value)

        if value is None:
            return {}

        return dict([
            (self.get_enum_target_name(val), True)
            for val in value
        ])


FIELD_TYPE_MAPPINGS = {
    'text': TextField,
    'integer': IntegerField,
    'float': FloatField,
    'boolean': BooleanField,
    'date': DateField,
    'time': TimeField,
    'dateTime': DateTimeField,
    'enumeration': EnumerationField,
    'enumerationSet': EnumerationSetField,
    'json': JsonField,
}


def make_field(field, name=None, instrument_version=None):
    cls = FIELD_TYPE_MAPPINGS.get(field['type']['base'])
    if not cls:
        raise Error(
            'Cannot map fields of type "%s"' % (field['type']['base'],)
        )

    mapped_field = cls(
        name or field['id'],
        instrument_version=instrument_version,
    )
    if isinstance(mapped_field, EnumerationField):
        mapped_field.enumerations = field['type']['enumerations'].keys()

    return mapped_field


HTSQL_DOMAIN_TYPES = {
    BooleanDomain: 'bool',
    IntegerDomain: 'integer',
    FloatDomain: 'float',
    DecimalDomain: 'float',
    TextDomain: 'text',
    EnumDomain: 'enumeration',
    DateDomain: 'date',
    TimeDomain: 'time',
    DateTimeDomain: 'dateTime',
    OpaqueDomain: 'text',
    IdentityDomain: 'text',
    JSONDomain: 'json',
}


def make_field_from_htsql(htsql_field):
    field_def = {
        'id': htsql_field.tag or htsql_field.header,
    }

    if htsql_field.domain.__class__ not in \
            HTSQL_DOMAIN_TYPES:  # pragma: no cover
        raise Error(
            'Cannot handle selector field of type "%r"' % (
                htsql_field.domain,
            ),
        )

    field_def['type'] = {
        'base': HTSQL_DOMAIN_TYPES[htsql_field.domain.__class__],
    }

    if field_def['type']['base'] == 'enumeration':
        field_def['type']['enumerations'] = dict(zip(
            htsql_field.domain.labels,
            [None] * len(htsql_field.domain.labels),
        ))

    return make_field(field_def)


LOWEST_COMMON_FIELD_TYPES = {
    TextField: {
        TextField: TextField,
        IntegerField: TextField,
        FloatField: TextField,
        BooleanField: TextField,
        DateField: TextField,
        TimeField: TextField,
        DateTimeField: TextField,
        EnumerationField: TextField,
    },

    IntegerField: {
        TextField: TextField,
        IntegerField: IntegerField,
        FloatField: FloatField,
        BooleanField: IntegerField,
        DateField: TextField,
        TimeField: TextField,
        DateTimeField: TextField,
        EnumerationField: TextField,
    },

    FloatField: {
        TextField: TextField,
        IntegerField: FloatField,
        FloatField: FloatField,
        BooleanField: FloatField,
        DateField: TextField,
        TimeField: TextField,
        DateTimeField: TextField,
        EnumerationField: TextField,
    },

    BooleanField: {
        TextField: TextField,
        IntegerField: IntegerField,
        FloatField: FloatField,
        BooleanField: BooleanField,
        DateField: TextField,
        TimeField: TextField,
        DateTimeField: TextField,
        EnumerationField: TextField,
    },

    DateField: {
        TextField: TextField,
        IntegerField: TextField,
        FloatField: TextField,
        BooleanField: TextField,
        DateField: DateField,
        TimeField: TextField,
        DateTimeField: DateTimeField,
        EnumerationField: TextField,
    },

    TimeField: {
        TextField: TextField,
        IntegerField: TextField,
        FloatField: TextField,
        BooleanField: TextField,
        DateField: TextField,
        TimeField: TimeField,
        DateTimeField: TextField,
        EnumerationField: TextField,
    },

    DateTimeField: {
        TextField: TextField,
        IntegerField: TextField,
        FloatField: TextField,
        BooleanField: TextField,
        DateField: DateTimeField,
        TimeField: TextField,
        DateTimeField: DateTimeField,
        EnumerationField: TextField,
    },

    EnumerationField: {
        TextField: TextField,
        IntegerField: TextField,
        FloatField: TextField,
        BooleanField: TextField,
        DateField: TextField,
        TimeField: TextField,
        DateTimeField: TextField,
        EnumerationField: EnumerationField,
        EnumerationSetField: EnumerationSetField,
    },

    EnumerationSetField: {
        EnumerationField: EnumerationSetField,
        EnumerationSetField: EnumerationSetField,
    },
}


def merge_field_into(collection, field):
    if field.name in collection:
        field_type = LOWEST_COMMON_FIELD_TYPES \
            .get(collection[field.name].__class__, {}) \
            .get(field.__class__)
        if not field_type:
            raise Error(
                'Cannot merge fields of types %s and %s (%s)' % (
                    collection[field.name].target_type,
                    field.target_type,
                    field.name,
                )
            )

        field = field_type.merge(
            collection[field.name],
            field,
        )
    collection[field.name] = field

