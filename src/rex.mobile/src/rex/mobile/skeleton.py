#
# Copyright (c) 2015, Prometheus Research, LLC
#


from copy import deepcopy

from rex.instrument import InstrumentVersion

from .interface import Interaction


__all__ = (
    'make_interaction_skeleton',
    'make_form_skeleton',
)


def make_interaction_skeleton(instrument, locale):
    """
    Generates a barebones SMS Interaction Configuration based on the specified
    Instrument definition.

    :param instrument: the Instrument Definition to generate an Interaction for
    :type instrument: dict
    :param locale:
        the locale to use as the defaultLocalization in the Interaction
    :type locale: str
    :rtype: dict
    """

    interaction = {}

    interaction['instrument'] = {
        'id': instrument['id'],
        'version': instrument['version'],
    }
    interaction['defaultLocalization'] = locale

    interaction['steps'] = []

    for field in instrument['record']:
        interaction['steps'].append({
            'type': 'question',
            'options': _make_question_options(field, instrument, locale),
        })

    Interaction.validate_configuration(
        interaction,
        instrument_definition=instrument,
    )

    return interaction


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
        opts['enumerations'] = [
            {
                'id': key,
                'text': {
                    locale: defn.get('description', key) if defn else key,
                },
            }
            for key, defn in list(type_def['enumerations'].items())
        ]

    return opts


def make_form_skeleton(interaction):
    """
    Generates a barebones Web Form Configuration from an SMS Interaction
    Configuration.

    :param interaction:
        the SMS Interaction Configuration to generate a Form from
    :type interaction: dict
    :rtype: dict
    """

    form = {}

    form['instrument'] = deepcopy(interaction['instrument'])
    form['defaultLocalization'] = interaction['defaultLocalization']

    form['pages'] = []
    form['pages'].append({
        'id': 'page1',
        'elements': deepcopy(interaction['steps'])
    })

    return form

