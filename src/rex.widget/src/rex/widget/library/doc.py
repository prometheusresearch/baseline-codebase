"""

    rex.widget.library.doc
    ======================

    :copyright: 2014, Prometheus Research, LLC

"""

from docutils.core import publish_parts

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
        return [self._format_widget(w, brief=True) for w in widgets]

    @Widget.define_state(AnyVal(), is_writable=False, dependencies=['selected'])
    def widget(self, state, graph, request):
        selected = graph[self.id].selected
        if selected:
            widget = Widget.map_all()[selected]
            return self._format_widget(widget)

    def _format_widget(self, widget, brief=False):
        result = {
            'name': str(widget.name),
            'module': widget.__module__ if not issubclass(widget, WidgetTemplate) else widget.template_location,
            'js_type': widget.js_type,
        }
        if not brief:
            result.update({
                'doc': render_rst(widget.__doc__),
                'fields': [self._format_field(widget, f) for f in widget.fields.values()],
            })
        return result

    def _format_field(self, widget, field):
        validate = field.validate
        while isinstance(validate, MaybeUndefinedVal):
            validate = validate.validate
        result = {
            'name': field.name,
            'doc': render_rst(field.__doc__),
            'type': repr(validate),
            'required': not field.has_default,
        }
        if field.widget_class is not None:
            result['owner_widget'] = str(field.widget_class.name)
        if field.default not in (NotImplemented, undefined, unknown):
            result['default'] = repr(field.default)
        return result


def render_rst(rst):
    if not rst:
        return rst
    lines = rst.split('\n')
    first_line, rest_lines = lines[0], lines[1:]
    if first_line.lstrip() != first_line:
        indent = len(first_line) - len(first_line.lstrip())
    elif rest_lines:
        indent = len(rest_lines[0]) - len(rest_lines[0].lstrip())
    else:
        indent = 0
    rst = '\n'.join(line[indent:] for line in lines)
    return publish_parts(rst, writer_name='html')['html_body']
