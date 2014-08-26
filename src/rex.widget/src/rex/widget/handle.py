"""

    rex.widget.handle
    =================

    :copyright: 2014, Prometheus Research, LLC

"""

from pyquerystring import parse as parse_qs
from webob import Response
from webob.exc import HTTPBadRequest, HTTPMethodNotAllowed
from rex.web import render_to_response
from .json import dumps
from .state import compute, compute_update, unknown


def handle(widget, req):
    accept = req.accept.best_match(['text/html', 'application/json'])
    desc = compute_descriptor(widget, req)
    desc = dumps(desc)
    if accept == 'application/json':
        return Response(desc, content_type='application/json')
    else:
        return render_to_response(
            'rex.widget:/templates/index.html', req,
            desc=desc)


def compute_descriptor(widget, req):
    user = req.environ.get('rex.user')
    descriptor = widget.descriptor()
    state = descriptor.state
    if req.method == 'GET':
        values = parse_qs(req.query_string)
        for k, v in values.items():
            if k in state and state[k].validator is not None:
                values[k] = state[k].validator(v)
        state = compute(state, values=values, user=user, defer=True)
        return descriptor._replace(state=state)
    elif req.method == 'POST':
        state, origins = state_update_params(state, req.json)
        if not origins:
            state = compute(state, user=user)
        else:
            state = compute_update(state, origins, user=user)
        return {"state": state}
    else:
        raise HTTPMethodNotAllowed()

def state_update_params(state, params):
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

