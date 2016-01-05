"""

    rex.widget_demo
    ===============

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import Setting, SeqVal, RecordVal, StrVal, get_settings
from rex.widget import computed_field, Widget, Chrome as ChromeBase


class RexWidgetDemoSetting(Setting):
    """
    Settings for Rex Widget demo app.
    """

    name = 'rex_widget_demo'

    menu_item_val = RecordVal(
        ('title', StrVal()),
        ('href', StrVal()),
    )

    menu_val = SeqVal(menu_item_val)

    validate = RecordVal((
        ('menu', menu_val, [])
    ))

    default = validate.record_type(
        menu=[]
    )


class Chrome(ChromeBase):
    js_type = 'rex-widget-demo/lib/Chrome'

    @computed_field
    def menu(self, req):
        return get_settings().rex_widget_demo.menu


class DemoPageHome(Widget):
    name = 'DemoPageHome'
    js_type = 'rex-widget-demo/lib/page/Home'


class DemoPageLayout(Widget):
    name = 'DemoPageLayout'
    js_type = 'rex-widget-demo/lib/page/Layout'


class DemoPageUI(Widget):
    name = 'DemoPageUI'
    js_type = 'rex-widget-demo/lib/page/UI'


class DemoPageForms(Widget):
    name = 'DemoPageForms'
    js_type = 'rex-widget-demo/lib/page/Forms'
