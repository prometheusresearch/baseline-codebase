from collections import OrderedDict
from rex.core import Setting, OMapVal, StrVal

class AssessmentTemplateDefaultColumnsSetting(Setting):
    """
    An ordered map, where key is an assessment template column name,
    value is a description.

    Example::

        assessment_template_default_columns: {'subject': 'Please provide the subject id here'}
    """

    name = 'assessment_template_default_columns'
    validate = OMapVal(StrVal, StrVal)
    default = OrderedDict((
                ('subject', 'Please provide the subject id here'),
                ('date', 'Please provide a date (YYYY-MM-DD)'),
                ('assessment_id', 'Please provide a unique id for this assessement')
             ))

