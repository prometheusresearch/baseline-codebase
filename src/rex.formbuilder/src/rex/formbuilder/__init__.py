from rex.core import Setting, BoolVal, StrVal
from .command import *

import errno

class ManualEditConditions(Setting):
    """
    Boolean parameter that specifies if it is allowed to manually edit
    conditions in Roads builder. By default, user is allowed only to use
    conditions wizard.

    Example:
      manual_edit_conditions: True
    """
    name = 'manual_edit_conditions'
    validator = BoolVal()
    default = False
