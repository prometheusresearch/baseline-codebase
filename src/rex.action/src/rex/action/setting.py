"""

    rex.action.setting
    ==================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import Setting, AnyVal


class RexActionSetting(Setting):
    """
    Rex Action site wide configuration.
    """

    name = 'rex_action'

    validate = AnyVal()
    default = None
