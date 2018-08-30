"""

    rex.action.setting
    ==================

    :copyright: 2015, Prometheus Research, LLC

"""



from rex.core import Setting, RecordVal, BoolVal


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


class RexActionValidateOnStartup(Setting):
    """
    UNSAFE! For development use only.
    Setting this to `false` permits to skip the wizards validation step on
    server startup. Should not be used in production or testing.
    """
    name = 'rex_action_validate_on_startup'
    validate = BoolVal()
    default = True
