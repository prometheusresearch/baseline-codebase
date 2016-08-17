#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.instrument.interface import InstrumentVersion
from rex.forms.interface import PresentationAdaptor


__all__ = (
    'ForceHotkeyPresentationAdaptor',
)


class ForceHotkeyPresentationAdaptor(PresentationAdaptor):
    """
    This PresentationAdaptor will forcibly set the ``autoHotkeys`` option to
    True for all ``enumeration``/``enumerationSet`` questions that use the
    default ``radioGroup``/``checkGroup`` widgets.
    """

    #:
    name = 'force-hotkeys'

    @classmethod
    def get_field(cls, record, field_id):
        for field in record:
            if field['id'] == field_id:
                return field

    @classmethod
    def update_elements(cls, instrument, record, element_options):
        for element in element_options:
            field = cls.get_field(record, element['fieldId'])
            type_def = InstrumentVersion.get_full_type_definition(
                instrument,
                field['type'],
            )

            if type_def['base'] in ('enumeration', 'enumerationSet'):
                widget_type = element.get('widget', {}).get('type', None)

                if widget_type in ('checkGroup', 'radioGroup'):
                    element['widget']['options'] = element['widget'].get(
                        'options',
                        {},
                    )
                    element['widget']['options']['autoHotkeys'] = True

                elif widget_type is None:
                    if type_def['base'] == 'enumeration':
                        new_widget_type = 'radioGroup'
                    else:
                        new_widget_type = 'checkGroup'

                    element['widget'] = element.get('widget', {})
                    element['widget']['type'] = new_widget_type
                    element['widget']['options'] = element['widget'].get(
                        'options',
                        {},
                    )
                    element['widget']['options']['autoHotkeys'] = True

            elif type_def['base'] == 'recordList':
                cls.update_elements(
                    instrument,
                    type_def['record'],
                    element['questions'],
                )

            elif type_def['base'] == 'matrix':
                cls.update_elements(
                    instrument,
                    type_def['columns'],
                    element['questions'],
                )

    @classmethod
    def adapt(cls, instrument, configuration):
        for page in configuration['pages']:
            cls.update_elements(
                instrument,
                instrument['record'],
                [
                    element['options']
                    for element in page['elements']
                    if element['type'] == 'question'
                ]
            )

        return configuration


