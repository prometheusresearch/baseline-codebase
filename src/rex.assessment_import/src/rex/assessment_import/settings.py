from collections import OrderedDict
from rex.core import Setting, OMapVal, StrVal, AnyVal


class AssessmentTemplateDefaultFieldsSetting(Setting):
    """
    An ordered map, where key is an assessment template field name,
    value is a description.

    Example::

        assessment_template_default_fields: {'subject': 'Please provide the subject id here'}
    """

    name = 'assessment_template_default_fields'
    validate = OMapVal(StrVal, StrVal)
    default = OrderedDict((
                ('subject', 'Please provide the subject id here'),
                ('date', 'Please provide a date (YYYY-MM-DD)'),
                ('assessment_id', 'Please provide a unique id for this assessement')
             ))


class AssessmentAdditionalDataSetting(Setting):
    """
    An ordered map to define data common for all imported assessments.

    Example::

        assessment_additional_data: {'study': 'foo'}
    """

    name = 'assessment_additional_data'
    validate = OMapVal(StrVal, AnyVal)
    default = OrderedDict()

