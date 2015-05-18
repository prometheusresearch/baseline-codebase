"""

    rex.widget.map
    ==============

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple

from webob import Response
from webob.exc import HTTPUnauthorized, HTTPBadRequest

from rex.core import Error, get_packages
from rex.web import authorize, render_to_response

from .widget import select_widget
from .keypath import KeyPathVal
from .transitionable import encode

__all__ = ('render',)


Bundle = namedtuple('Bundle', ['root', 'js', 'css'])


BUNDLE_PATHS = Bundle(
    root='/www/bundle/',
    js='/www/bundle/bundle.js',
    css='/www/bundle/bundle.css')


def find_bundle():
    packages = get_packages()
    root = css = js = None
    www = '/www'
    for package in packages:
        root_exists = package.exists(BUNDLE_PATHS.root)
        js_exists = package.exists(BUNDLE_PATHS.js)
        css_exists = package.exists(BUNDLE_PATHS.css)
        if root_exists and (js_exists or css_exists):
            root = '%s:%s' % (package.name, BUNDLE_PATHS.root[len(www):])
            if css_exists:
                css = '%s:%s' % (package.name, BUNDLE_PATHS.css[len(www):])
            if js_exists:
                js = '%s:%s' % (package.name, BUNDLE_PATHS.js[len(www):])
            return Bundle(root=root, js=js, css=css)


validate_widget_path = KeyPathVal(allow_empty=True)


def render(widget, request, template='rex.widget:/templates/index.html'):
    """ Render ``widget`` in the context of a given ``request``.

    Can be used by WSGI applications to generate responses from widgets::

        import webob

        @webob.dec.wsgify
        def application(req):
            widget = Panel(children=[
                Title(title='Title'),
                Panel(children=[]),
                ])
            return render_widget(widget, req)
    
    :param widget: Widget instance to render
    :type widget: :class:`rex.widget.Widget`

    :param request: WSGI request
    :type request: :class:`webob.Request`

    :return: WSGI response
    :rtype: :class:`webob.Response`
    """
    if '__to__' in request.GET:
        widget_path = request.GET.pop('__to__')
        widget_path = validate_widget_path(widget_path)
        widget = select_widget(widget, widget_path)
        if not hasattr(widget, 'respond'):
            raise HTTPBadRequest('unable to locate responder via __to__ pointer')
        return widget.respond(request)
    else:
        accept = request.accept.best_match(['text/html', 'application/json'])
        payload = encode(widget(request), request)
        if accept == 'application/json':
            return Response(payload, content_type='application/json')
        else:
            return render_to_response(
                template, request,
                bundle=find_bundle(), payload=payload)
