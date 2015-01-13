"""

    rex.widget.library.doc
    ======================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import AnyVal
from ..widget import Widget

__all__ = ('DocScreen',)


class DocScreen(Widget):
    """ Documentation screen widget.

    A complete screen which provides documentation on all available widgets in
    the system.
    """

    name = 'DocScreen'
    js_type = 'rex-widget/lib/doc/Screen'

    @Widget.define_state(AnyVal())
    def widgets(self, state, graph, request):
        widgets = Widget.all()
        widgets = sorted(widgets, key=lambda w: w.name)
        return [self._format_widget(w) for w in widgets]

    def _format_widget(self, widget):
        return {
            'name': widget.name,
            'doc': widget.__doc__,
            'js_type': widget.js_type,
            'fields': [self._format_field(f) for f in widget.fields.values()],
        }

    def _format_field(self, field):
        return {
            'name': field.name,
            'doc': field.__doc__,
        }
