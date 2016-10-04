#
# Copyright (c) 2016, Prometheus Research, LLC
#


import string

from rex.instrument import InstrumentVersion

from .interface import Form


__all__ = (
    'make_form_skeleton',
)


def make_form_skeleton(instrument, locale):
    """
    Generates a barebones Web Form Configuration based on the specified
    Instrument definition.

    :param instrument: the Instrument Definition to generate a Form for
    :type instrument: dict
    :param locale: the locale to use as the defaultLocalization in the Form
    :type locale: str
    :rtype: dict
    """

    form = {}

    form['instrument'] = {
        'id': instrument['id'],
        'version': instrument['version'],
    }
    form['defaultLocalization'] = locale
    form['title'] = {locale: instrument['title']}

    page = {
        'id': 'page1',
        'elements': [],
    }

    for field in instrument['record']:
        page['elements'].append({
            'type': 'question',
            'options': _make_question_options(field, instrument, locale),
        })

    form['pages'] = [page]

    Form.validate_configuration(form, instrument_definition=instrument)

    return form


def _make_question_options(field, instrument, locale):
    opts = {
        'fieldId': field['id'],
        'text': {locale: field.get('description', field['id'])},
    }

    type_def = InstrumentVersion.get_full_type_definition(
        instrument,
        field['type'],
    )

    if 'enumerations' in type_def:
        opts['enumerations'] = sorted(
            [
                {
                    'id': key,
                    'text': {
                        locale: defn.get('description', key) if defn else key
                    }
                }
                for key, defn in type_def['enumerations'].items()
            ],
            key=lambda x: x['id'],
        )

        hotkeys = {}
        if len(opts['enumerations']) <= 10:
            for enum in opts['enumerations']:
                if len(enum['id']) == 1 and enum['id'] in string.digits:
                    hotkeys[enum['id']] = enum['id']
        if len(hotkeys) == len(opts['enumerations']):
            if type_def['base'] == 'enumerationSet':
                widget_type = 'checkGroup'
            else:
                widget_type = 'radioGroup'
            opts['widget'] = {
                'type': widget_type,
                'options': {
                    'hotkeys': hotkeys,
                }
            }

    if 'rows' in type_def:
        opts['rows'] = [
            {
                'id': row['id'],
                'text': {locale: row.get('description', row['id'])},
            }
            for row in type_def['rows']
        ]

    for name in ('record', 'columns'):
        if name in type_def:
            opts['questions'] = [
                _make_question_options(subfield, instrument, locale)
                for subfield in type_def[name]
            ]

    return opts

