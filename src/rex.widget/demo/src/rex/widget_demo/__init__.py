"""

    rex.widget_demo
    ===============

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal, SeqVal
from rex.widget import (
    Widget, WidgetVal, Field,
    EntitySpecVal, CollectionSpecVal,
    FormFieldVal, ColumnVal)

class App(Widget):

    name = 'App'
    js_type = 'rex-widget-demo'

    title = Field(
        StrVal(),
        doc="""
        Application title.
        """)

    footer_text = Field(
        StrVal(),
        doc="""
        Footer text.
        """)

    help_text = Field(
        StrVal(),
        doc="""
        Help text.
        """)

    list = Field(
        CollectionSpecVal(),
        doc="""
        Data specification for todo collection.
        """)

    item = Field(
        EntitySpecVal(),
        doc="""
        Data specification for todo item which is fetched when a todo is
        selected.
        """)

    columns = Field(
        SeqVal(ColumnVal()),
        doc="""
        A list of columns to shown for the todo collection.
        """)

    fields = Field(
        SeqVal(FormFieldVal()),
        doc="""
        A set of fields to show in todo info.
        """)


class DemoPage(Widget):

    name = 'DemoPage'
    js_type = 'rex-widget-demo/lib/DemoPage'

    title = Field(
        StrVal(),
        doc="""
        Page's title.
        """)

    children = Field(
        WidgetVal(),
        doc="""
        Page's children widgets.
        """)
