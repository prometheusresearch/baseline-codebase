"""

    rex.action.setting
    ==================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import Setting, AnyVal, RecordVal, BoolVal


class RexActionSetting(Setting):
    """
    Rex Action site wide configuration.
    """

    name = 'rex_action'

    validate = RecordVal(
        ('include_page_breadcrumb_item', BoolVal(), False)
    )
    default = validate.record_type(
        include_page_breadcrumb_item=False)
