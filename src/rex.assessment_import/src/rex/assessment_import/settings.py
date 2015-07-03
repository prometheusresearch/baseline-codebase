from collections import OrderedDict
from rex.core import Setting, OMapVal, StrVal, AnyVal


class AssessmentImportTemplateDefaults(Setting):
    """
    An ordered map, where key is an assessment template field name,
    value is a description.

    Example::

        assessment_import_template_defaults: {'subject': 'Please provide the subject id here'}
    """

    name = 'assessment_import_template_defaults'
    validate = OMapVal(StrVal, StrVal)
    default = OrderedDict((
                ('subject', 'Please provide the subject id here'),
                ('date', 'Please provide a date (YYYY-MM-DD)'),
                ('assessment_id', 'Please provide a unique id for this assessement')
             ))


class AssessmentImportContextSetting(Setting):
    """
    An ordered map to define data common for all imported assessments.

    Example::

        assessment_import_context: {'study': 'foo', 'sex': 'female'}
    """

    name = 'assessment_import_context'
    validate = OMapVal(StrVal, AnyVal)
    default = OrderedDict()

