#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import Error, StrVal
from rex.web import authorize
from rex.widget import WidgetVal
from .map import Map
from webob.exc import HTTPUnauthorized


class WidgetRenderer(object):
    # Renders a widget.

    def __init__(self, widget, access):
        self.widget = widget
        self.access = access

    def __call__(self, req):
        self.authorize(req)
        try:
            return self.widget(req)
        except Error, error:
            return req.get_response(error)

    def authorize(self, req):
        if not authorize(req, self.access):
            raise HTTPUnauthorized()


class MapWidget(Map):
    # Parses a urlmap.yaml record.

    fields = [
            ('widget', WidgetVal),
            ('access', StrVal, None),
    ]

    def __call__(self, spec, path, context):
        access = spec.access or self.package.name
        return WidgetRenderer(
                widget=spec.widget,
                access=access)

    def override(self, spec, override_spec):
        if override_spec.widget is not None:
            spec = spec.__clone__(widget=override_spec.widget)
        if override_spec.access is not None:
            spec = spec.__clone__(access=override_spec.access)
        return spec


