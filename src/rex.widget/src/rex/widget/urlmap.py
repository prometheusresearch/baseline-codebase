"""

    rex.widget.urlmap
    =================

    :copyright: 2014, Prometheus Research, LLC

"""

from pyquerystring import parse as parse_qs
from webob.exc import HTTPUnauthorized, HTTPBadRequest, HTTPMethodNotAllowed
from webob import Response

from rex.core import Error, StrVal, guard
from rex.web import authorize, render_to_response
from rex.urlmap import Map

from .state import compute, compute_update, unknown
from .parse import WidgetVal
from .json import dumps


class MapWidget(Map):
    """ Parses an URL mapping record."""

    fields = [
        ('widget', WidgetVal),
        ('access', StrVal, None),
    ]

    def __call__(self, spec, path, context):
        access = spec.access or self.package.name
        widget = spec.widget(context)
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
            values = _validate_values(state, parse_qs(request.query_string))
            state = compute(
                state, request, values=values, user=user, defer=True)
            values = state.get_values()
            versions = {k: 1 for k in values}
            return {
                'descriptor': descriptor._replace(state=state),
                'values': values,
                'versions': versions
            }
        elif request.method == 'POST':
            state, origins = _merge_state_update(state, request.json['values'])
            if not origins:
                state = compute(state, request, user=user)
            else:
                state = compute_update(state, request, origins, user=user)
            return {
                'descriptor': None,
                'values': state.get_values(),
                'versions': request.json['versions']
            }
        else:
            raise HTTPMethodNotAllowed()

    def __call__(self, request):
        """ Handle WSGI request

        :param request: WSGI request
        :type request: :class:`webob.Request`
        :returns: WSGI response
        :rtype: :class:`webob.Response`
        """
        self.authorize(request)
        try:
            accept = request.accept.best_match(
                ['text/html', 'application/json'])
            payload = self.payload(request)
            if accept == 'application/json':
                return Response(dumps(payload), content_type='application/json')
            else:
                return render_to_response(
                    self.TEMPLATE, request, payload=dumps(payload))
        except Error, error:
            return request.get_response(error)


def _validate_values(state, values):
    aliases = {s.alias: s.id for s in state.values() if s.alias}
    validated = {}
    for k, value in values.items():
        state_id = aliases.get(k, k)
        if not state_id in state:
            raise HTTPBadRequest(
                'invalid state id or state alias: %s' % state_id)
        with guard('While validating state: %s' % state_id):
            validated[state_id] = state[state_id].validator(value)
    return validated


def _merge_state_update(state, params):
    origins = []
    values = {}

    for state_id, value in params.items():
        if state_id.startswith('update:'):
            state_id = state_id[7:]
            origins.append(state_id)

        if not state_id in state:
            raise HTTPBadRequest("invalid state id: %s" % state_id)

        if value != unknown.tag:
            values[state_id] = value

    values = _validate_values(state, values)
    state = state.merge({
        k: state[k]._replace(value=v) for k, v in values.items()})

    return state, origins
