"""

    rex.widget.chrome
    =================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.core import StrVal, get_settings

from .widget import Widget
from .field import Field
from .validate import WidgetVal

__all__ = ('get_chrome', 'Chrome')


def get_chrome():
    """ Get configured chrome widget class."""
    settings = get_settings()
    return settings.rex_widget.chrome


class Chrome(Widget):
    """ Base chrome class."""

    js_type = 'rex-widget/lib/Chrome'

    content = Field(
        WidgetVal(single=True),
        doc="""
        Chrome content.
        """)

    title = Field(
        StrVal(), default=None)

    def __init__(self, **values):
        super(Chrome, self).__init__(**values)
        if self.content and hasattr(self.content, 'title'):
            self.title = self.content.title
