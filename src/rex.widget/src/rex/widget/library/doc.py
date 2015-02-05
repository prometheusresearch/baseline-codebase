"""

    rex.widget.library.doc
    ======================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import AnyVal, StrVal
from ..widget import Widget
from ..field import StateField
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

    @Widget.define_state(AnyVal())
    def widgets(self, state, graph, request):
        widgets = Widget.map_all().values()
        widgets = sorted(widgets, key=lambda w: w.name)
        #return []
        return [self._format_widget(w) for w in widgets]

    def _format_widget(self, widget):
        return {
            'name': str(widget.name),
            'module': widget.__module__,
            'doc': widget.__doc__,
            'js_type': widget.js_type,
            'fields': [self._format_field(f) for f in widget.fields.values()],
        }

    def _format_field(self, field):
        validate = field.validate
        while isinstance(validate, MaybeUndefinedVal):
            validate = validate.validate
        return {
            'name': field.name,
            'doc': field.__doc__,
            'type': repr(validate),
            'required': not field.has_default,
            'default': repr(field.default),
        }
