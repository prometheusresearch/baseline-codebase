"""

    rex.widget.map
    ==============

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property
from webob.exc import HTTPUnauthorized

from rex.urlmap import Map
from rex.core import Error, StrVal, MapVal, BoolVal
from rex.web import authorize, confine

from .validate import WidgetVal, DeferredVal
from .render import render

__all__ = ('MapWidget', 'WidgetRenderer')


class MapWidget(Map):
    """ Parses an URL mapping record."""

    fields = [
        ('widget', DeferredVal()),
        ('title', StrVal(), None),
        ('no_chrome', BoolVal(), False),
        ('access', StrVal(), None),
        ('slots', MapVal(StrVal(), DeferredVal()), {}),
    ]

    def __call__(self, spec, path, context):
        access = spec.access or self.package.name
        widget = lambda: spec.widget.resolve(WidgetVal(context=spec.slots))
        return WidgetRenderer(
            path, widget, access,
            title=spec.title,
            no_chrome=spec.no_chrome)

    def override(self, spec, override_spec):
        if override_spec.widget is not None:
            spec = spec.__clone__(widget=override_spec.widget)
        if override_spec.title is not None:
            spec = spec.__clone__(title=override_spec.title)
        if override_spec.access is not None:
            spec = spec.__clone__(access=override_spec.access)
        if override_spec.slots is not None:
            slots = {}
            slots.update(spec.slots)
            slots.update(override_spec.slots)
            spec = spec.__clone__(slots=slots)
        if override_spec.no_chrome != spec.no_chrome:
            spec = spec.__clone__(access=override_spec.no_chrome)
        return spec


class WidgetRenderer(object):

    def __init__(self, path, widget, access, title=None, no_chrome=False):
        self.path = path
        self._widget = widget
        self.access = access
        self.title = title
        self.no_chrome = no_chrome

    @cached_property
    def widget(self):
        return self._widget()

    def validate(self):
        self.widget

    def __call__(self, request):
        if not authorize(request, self.access):
            raise HTTPUnauthorized()
        try:
            with confine(request, self):
                return render(
                    self.widget, request,
                    title=self.title,
                    no_chrome=self.no_chrome)
        except Error, error:
            return request.get_response(error)
