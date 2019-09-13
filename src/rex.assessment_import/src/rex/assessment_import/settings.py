from collections import OrderedDict
from rex.core import (
    Setting, OMapVal, StrVal, PathVal, BoolVal, RecordVal, SeqVal
)


class AssessmentImportDir(Setting):

    """
    Directory where to save uploaded files and other attachments.

    Example::

        assessment_import_dir: /srv/rexdb/assessments
    """

    name = 'assessment_import_dir'
    validate = PathVal()
    default = None


class AssessmentTemplateDefaults(Setting):
    """
    An ordered map, where key is an assessment template field name,
    value is a description.

    Example::

        assessment_template_defaults:
            {'subject':
                {'description': 'Please provide the subject id here',
                 'required': False
                }
            }
    """

    name = 'assessment_template_defaults'
    validate = OMapVal(StrVal,
                       RecordVal([('required', BoolVal()),
                                  ('description', StrVal())
                       ])
               )
    default = OrderedDict((
                ('subject', {'description': 'Please provide the subject id here',
                             'required': True
                            }
                ),
                ('date', {'description': 'Please provide a date (YYYY-MM-DD)',
                          'required': False
                         }
                ),
                ('assessment_id',
                    {'description':
                        'Please provide a unique id for this assessement',
                     'required': True
                    }
                ),
             ))


class AssessmentContextFields(Setting):
    """
        List of field names to find in assessment implementation context
        to include as assessment template fields.
    """

    name = 'assessment_context_fields'
    validate = SeqVal(StrVal())
    default = []

