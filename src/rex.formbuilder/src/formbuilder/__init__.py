from rexrunner.registry import register_parameter
from htsql.core.validator import BoolVal
from rexrunner.parameter import Parameter
from .command import *

@register_parameter
class ManualEditConditions(Parameter):
    """
    Boolean parameter that specifies if it is allowed to manually edit 
    conditions in Roads builder. By default, user is allowed only to use
    conditions wizard.

    Example:
      manual_edit_conditions: True
    """
    name = 'manual_edit_conditions'
    validator = BoolVal(is_nullable=False)
    default = False

