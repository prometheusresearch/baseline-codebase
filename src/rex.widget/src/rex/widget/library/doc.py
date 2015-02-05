"""

    rex.widget.library.doc
    ======================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import AnyVal, StrVal
from ..template import WidgetTemplate
from ..undefined import undefined
from ..widget import Widget
from ..field import StateField
from ..state import unknown
from ..undefined import MaybeUndefinedVal


__all__ = ('DocScreen',)


class DocScreen(Widget):
    """ Documentation screen widget.

    A complete screen which provides documentation on all available widgets in
    the system.
    """

    name = 'DocScreen'
    js_type = 'rex-widget/lib/doc/Screen'

    selected = StateField(
        StrVal(), default=None,
        doc="""
        Currently selected widget.
        """)

    @Widget.define_state(AnyVal(), is_writable=False)
    def widgets(self, state, graph, request):
        widgets = Widget.map_all().values()
        widgets = sorted(widgets, key=lambda w: w.name)
        return [self._format_widget(w) for w in widgets]

    def _format_widget(self, widget):
        return {
            'name': str(widget.name),
            'module': widget.__module__ if not issubclass(widget, WidgetTemplate) else widget.template_location,
            'doc': widget.__doc__,
            'js_type': widget.js_type,
            'fields': [self._format_field(widget, f) for f in widget.fields.values()],
        }

    def _format_field(self, widget, field):
        validate = field.validate
        while isinstance(validate, MaybeUndefinedVal):
            validate = validate.validate
        result = {
            'name': field.name,
            'doc': field.__doc__,
            'type': repr(validate),
            'required': not field.has_default,
        }
        if field.widget_class is not None:
            result['owner_widget'] = str(field.widget_class.name)
        if field.default not in (NotImplemented, undefined, unknown):
            result['default'] = repr(field.default)
        return result
