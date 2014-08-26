"""

    rex.widget.handle
    =================

    :copyright: 2014, Prometheus Research, LLC

"""

from pyquerystring import parse as parse_qs
from webob import Response
from webob.exc import HTTPBadRequest, HTTPMethodNotAllowed

from rex.core import cached
from rex.web import render_to_response

from .json import dumps
from .state import compute, compute_update, unknown


TEMPLATE = 'rex.widget:/templates/index.html'


def handle(widget, req):
    accept = req.accept.best_match(['text/html', 'application/json'])
    desc = compute_descriptor(widget, req)
    if accept == 'application/json':
        return Response(dumps(desc), content_type='application/json')
    else:
        return render_to_response(TEMPLATE, req, desc=dumps(desc))


def compute_descriptor(widget, req):
    user = req.environ.get('rex.user')
    descriptor = widget.descriptor()
    state = descriptor.state
    if req.method == 'GET':
        aliases = get_alias_mapping(state)
        values = {
            aliases.get(k, k): state[k].validator(v) if k in state else v
            for k, v in parse_qs(req.query_string).items()
        }
        state = compute(state, values=values, user=user, defer=True)
        return {
            "descriptor": descriptor._replace(state=state),
            "values": state.get_values()
        }
    elif req.method == 'POST':
        state, origins = merge_state_update(state, req.json)
        if not origins:
            state = compute(state, user=user)
        else:
            state = compute_update(state, origins, user=user)
        return {
            "descriptor": None,
            "values": state.get_values()
        }
    else:
        raise HTTPMethodNotAllowed()


def merge_state_update(state, params):
    origins = []
    updates = {}

    for id, value in params.items():
        if id.startswith('update:'):
            id = id[7:]
            origins.append(id)

        if not id in state:
            raise HTTPBadRequest("invalid state id: %s" % id)

        if value != unknown.tag:
            updates[id] = state[id]._replace(value=value)

    state = state.merge(updates)

    return state, origins


def get_alias_mapping(state):
    return {s.alias: s.id for s in state.values() if s.alias}
