#
# Copyright (c) 2014, Prometheus Research, LLC
#


import json
import pkg_resources


__all__ = (
    'FORM_SCHEMA_JSON',
    'FORM_SCHEMA',
    'FORM_ELEMENT_OPTIONS',
    'FORM_ELEMENT_REQUIRED',
    'JSONSCHEMA_SCHEMA_JSON',
    'JSONSCHEMA_SCHEMA',
)


FORM_SCHEMA_JSON = pkg_resources.resource_string(
    __name__,
    'schemas/form.json',
)


FORM_SCHEMA = json.loads(FORM_SCHEMA_JSON)


FORM_ELEMENT_OPTIONS = {
    'question': set([
        'fieldId',
        'text',
        'help',
        'error',
        'enumerations',
        'questions',
        'rows',
        'widget',
        'events',
    ]),

    'header': set([
        'text',
    ]),

    'text': set([
        'text',
    ]),

    'divider': set([
    ]),
}


FORM_ELEMENT_REQUIRED = {
    'question': set([
        'fieldId',
        'text',
    ]),

    'header': set([
        'text',
    ]),

    'text': set([
        'text',
    ]),

    'divider': set([
    ]),
}


JSONSCHEMA_SCHEMA_JSON = pkg_resources.resource_string(
    __name__,
    'schemas/jsonschema.json',
)


JSONSCHEMA_SCHEMA = json.loads(JSONSCHEMA_SCHEMA_JSON)

