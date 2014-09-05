"""

    rex.widget.handle
    =================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import defaultdict
from pyquerystring import parse as parse_qs
from webob import Response
from webob.exc import HTTPBadRequest, HTTPMethodNotAllowed

from rex.core import cached, get_packages
from rex.web import render_to_response, get_routes

from .json import dumps
from .state import compute, compute_update, unknown


TEMPLATE = 'rex.widget:/templates/index.html'
INITIAL_VERSIONS = defaultdict(lambda: 1)


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
        values = validate_values(state, parse_qs(req.query_string))
        state = compute(state, values=values, user=user, defer=True)
        values = state.get_values()
        versions = {k: 1 for k in values}
        return {
            'descriptor': descriptor._replace(state=state),
            'values': values,
            'versions': versions,
            'map': get_widget_map(),
        }
    elif req.method == 'POST':
        state, origins = merge_state_update(state, req.json['values'])
        if not origins:
            state = compute(state, user=user)
        else:
            state = compute_update(state, origins, user=user)
        return {
            'descriptor': None,
            'values': state.get_values(),
            'versions': req.json['versions']
        }
    else:
        raise HTTPMethodNotAllowed()


def validate_values(state, values):
    aliases = get_alias_mapping(state)
    validated = {}
    for k, value in values.items():
        id = aliases.get(k, k)
        if not id in state:
            raise HTTPBadRequest("invalid state id or state alias: %s" % id)
        validated[id] = state[id].validator(value)
    return validated


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

@cached
def get_widget_map():
    from rex.urlmap.handle import WidgetRenderer
    widget_map = {}
    packages = get_packages()
    for package in packages:
        routes = get_routes(package)
        for path, handler in iter_pathmap_tree(routes.tree):
            if not isinstance(handler, WidgetRenderer):
                continue
            widget_map[path] = {
                k.alias: True
                for k in handler.widget.states.values()}
    return widget_map


def iter_pathmap_tree(tree, _prefix=''):
    if not _prefix or _prefix[-1] != '/':
        _prefix += '/'
    for k, v in tree.items():
        if k is None:
            k = ''
        prefix = '%s%s' % (_prefix, k)
        if not isinstance(k, basestring):
            continue
        if isinstance(v, dict):
            for s in iter_pathmap_tree(v, _prefix=prefix):
                yield s
        else:
            for _guard, handler in v:
                if len(prefix) > 1 and prefix[-1] == '/':
                    prefix = prefix[:-1]
                yield prefix, handler
