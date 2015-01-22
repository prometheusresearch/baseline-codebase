"""

    rex.widget.urlmap
    =================

    :copyright: 2014, Prometheus Research, LLC

"""

import yaml
import collections
import weakref

from pyquerystring import parse as parse_qs
from webob.exc import HTTPUnauthorized, HTTPBadRequest, HTTPMethodNotAllowed
from webob import Response

from rex.core import Validate, Error, StrVal, MapVal, AnyVal, RecordVal, guard
from rex.core import get_packages
from rex.web import authorize, render_to_response
from rex.urlmap import Map

from .context import Context, activated_context
from .descriptors import DataRead
from .state import compute, compute_update, unknown
from .parse import WidgetDescVal
from .validate import WidgetVal
from .json_encoder import dumps
from .template import load as load_templates


class PageContext(Context):

    def __init__(self):
        self.widget_count = weakref.WeakKeyDictionary()

    def generate_widget_id(self, widget_class):
        widget_count = self.widget_count.get(widget_class, 0)
        widgen_name = widget_class.name
        self.widget_count[widget_class] = widget_count + 1
        if widget_count == 0:
            return widgen_name
        else:
            return '%s%s' % (widgen_name, widget_count)


class MapWidget(Map):
    """ Parses an URL mapping record."""

    fields = [
        ('widget', WidgetDescVal),
        ('access', StrVal, None),
    ]

    validate_widget_desc = WidgetVal()

    def __call__(self, spec, path, context):
        load_templates('widgets.yaml')
        access = spec.access or self.package.name
        with activated_context(PageContext()):
            widget = self.validate_widget_desc(spec.widget)
        widget.package = self.package
        return WidgetRenderer(
            widget=widget,
            access=access)

    def override(self, spec, override_spec):
        if override_spec.widget is not None:
            spec = spec.__clone__(widget=override_spec.widget)
        if override_spec.access is not None:
            spec = spec.__clone__(access=override_spec.access)
        return spec


class WidgetRenderer(object):
    """ Render a widget

    :param widget: Widget to render
    :type widget: :class:`rex.widget.Widget`
    :param access: Authorization specifier
    :type widget: str
    """

    TEMPLATE = 'rex.widget:/templates/index.html'
    CSS_BUNDLE = '/www/bundle/bundle.css'
    JS_BUNDLE = '/www/bundle/bundle.js'

    _validate_mapping = MapVal(StrVal(), AnyVal())

    _validate_state_update = RecordVal(
        ('updates', _validate_mapping),
        ('values', _validate_mapping),
        ('versions', _validate_mapping),
    )

    def __init__(self, widget, access):
        self.widget = widget
        self.access = access

    def authorize(self, request):
        """ Authorize request

        :param request: WSGI request
        :type request: :class:`webob.Request`
        """
        if not authorize(request, self.access):
            raise HTTPUnauthorized()

    def payload(self, request):
        """ Generate request payload.

        :param request: WSGI request
        :type request: :class:`webob.Request`
        """
        user = request.environ.get('rex.user')
        descriptor = self.widget.descriptor()
        state = descriptor.state
        if request.method == 'GET':
            values = _validate_qs_values(state, parse_qs(request.query_string))
            state = compute(
                state, request, values=values, user=user, defer=True)
            values = state.get_values()
            versions = {k: 1 for k in values}
            return {
                'descriptor': descriptor._replace(state=state),
                'state': values,
                'versions': versions,
                'data': _extract_data(values),
            }
        elif request.method == 'POST':
            if request.content_type == 'application/x-www-form-urlencoded':
                values = _validate_qs_values(state, parse_qs(request.body))
                state = compute(
                    state, request, values=values, user=user, defer=True)
                values = state.get_values()
                versions = {k: 1 for k in values}
                return {
                    'descriptor': descriptor._replace(state=state),
                    'state': values,
                    'versions': versions,
                    'data': _extract_data(values),
                }
            elif request.content_type == 'application/json':
                update = self._validate_state_update(request.json)
                state = state.merge_values(update.values)
                if not update.updates:
                    state = compute(state, request, user=user)
                else:
                    state = compute_update(state, update.updates, request, user=user)
                values = state.get_values()
                return {
                    'descriptor': None,
                    'state': values,
                    'versions': update.versions,
                    'data': _extract_data(values),
                }
            else:
                raise HTTPBadRequest()
        else:
            raise HTTPMethodNotAllowed()

    def find_bundle(self):
        packages = get_packages()
        css = js = None
        www = '/www'
        for package in packages:
            if css is None and package.exists(self.CSS_BUNDLE):
                css = '%s:%s' % (package.name, self.CSS_BUNDLE[len(www):])
            if js is None and package.exists(self.JS_BUNDLE):
                js = '%s:%s' % (package.name, self.JS_BUNDLE[len(www):])
        Bundle = collections.namedtuple('Bundle', 'js css')
        return Bundle(js=js, css=css)

    def __call__(self, request):
        """ Handle WSGI request

        :param request: WSGI request
        :type request: :class:`webob.Request`
        :returns: WSGI response
        :rtype: :class:`webob.Response`
        """
        load_templates('widgets.yaml')
        self.authorize(request)
        try:
            accept = request.accept.best_match(
                ['text/html', 'application/json'])
            payload = self.payload(request)
            if accept == 'application/json':
                return Response(dumps(payload), content_type='application/json')
            else:
                return render_to_response(self.TEMPLATE,
                                          request,
                                          bundle=self.find_bundle(),
                                          payload=dumps(payload))
        except Error, error:
            raise
            return request.get_response(error)


def _extract_data(values):
    data = {}
    for k, v in values.items():
        if isinstance(v, DataRead):
            data.setdefault(v.entity, []).append(v.data)
    return data


def _validate_qs_values(state, values):
    aliases = {s.alias: s.id for s in state.values() if s.alias}
    validated = {}
    for k, value in values.items():
        state_id = aliases.get(k, k)
        #if not state_id in state:
        #    raise HTTPBadRequest(
        #        'invalid state id or state alias: %s' % state_id)
        if state_id in state:
            with guard('While validating state: %s' % state_id):
                validated[state_id] = state[state_id].validator(value)
    return validated
