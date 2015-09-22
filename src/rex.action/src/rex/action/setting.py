"""

    rex.action.setting
    ==================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import Setting, StrVal, RecordVal
from .wizard import SideBySideWizard


class RexActionSetting(Setting):
    """
    Rex Action site wide configuration.

    Example::

        rex_action:
            side_by_side:
                breadcrumb: bottom
    """

    name = 'rex_action'

    _side_by_side_val = RecordVal(
        ('breadcrumb', SideBySideWizard.breadcrumb.validate)
    )
    _side_by_side_default = _side_by_side_val.record_type(breadcrumb='top')

    validate = RecordVal(
        ('side_by_side', _side_by_side_val, _side_by_side_default)
    )
    default = validate.record_type(side_by_side=_side_by_side_default)

