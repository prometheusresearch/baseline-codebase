#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json
import pkg_resources


__all__ = (
    'INSTRUMENT_SCHEMA_JSON',
    'INSTRUMENT_SCHEMA',
    'INSTRUMENT_SIMPLE_TYPES',
    'INSTRUMENT_COMPLEX_TYPES',
    'INSTRUMENT_BASE_TYPES',
    'INSTRUMENT_FIELD_CONSTRAINTS',
    'INSTRUMENT_REQUIRED_CONSTRAINTS',
    'ASSESSMENT_SCHEMA_JSON',
    'ASSESSMENT_SCHEMA',
    'JSONSCHEMA_SCHEMA_JSON',
    'JSONSCHEMA_SCHEMA',
)


# pylint: disable=E1101


INSTRUMENT_SCHEMA_JSON = pkg_resources.resource_string(
    __name__,
    'schemas/instrument.json',
)


INSTRUMENT_SCHEMA = json.loads(INSTRUMENT_SCHEMA_JSON)


INSTRUMENT_SIMPLE_TYPES = set(
    INSTRUMENT_SCHEMA['definitions']['simpleDataType']['enum']
)


INSTRUMENT_COMPLEX_TYPES = set(
    INSTRUMENT_SCHEMA['definitions']['complexDataType']['enum']
)


INSTRUMENT_BASE_TYPES = INSTRUMENT_SIMPLE_TYPES | INSTRUMENT_COMPLEX_TYPES


INSTRUMENT_FIELD_CONSTRAINTS = {
    'integer': set([
        'range',
    ]),

    'float': set([
        'range',
    ]),

    'text': set([
        'length',
        'pattern',
    ]),

    'enumeration': set([
        'enumerations',
    ]),

    'enumerationSet': set([
        'enumerations',
        'length',
    ]),

    'date': set([
        'range',
    ]),

    'time': set([
        'range',
    ]),

    'dateTime': set([
        'range',
    ]),

    'recordList': set([
        'record',
        'length',
    ]),

    'matrix': set([
        'columns',
        'rows',
    ]),
}


INSTRUMENT_REQUIRED_CONSTRAINTS = {
    'enumeration': set([
        'enumerations',
    ]),

    'enumerationSet': set([
        'enumerations',
    ]),

    'recordList': set([
        'record',
    ]),

    'matrix': set([
        'columns',
        'rows',
    ]),
}


ASSESSMENT_SCHEMA_JSON = pkg_resources.resource_string(
    __name__,
    'schemas/assessment.json',
)


ASSESSMENT_SCHEMA = json.loads(ASSESSMENT_SCHEMA_JSON)


JSONSCHEMA_SCHEMA_JSON = pkg_resources.resource_string(
    __name__,
    'schemas/jsonschema.json',
)


JSONSCHEMA_SCHEMA = json.loads(JSONSCHEMA_SCHEMA_JSON)

