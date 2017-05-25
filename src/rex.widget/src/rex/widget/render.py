"""

    rex.widget.map
    ==============

    :copyright: 2015, Prometheus Research, LLC

"""

from collections import namedtuple
import json
import pkg_resources
import os

from webob import Response
from webob.exc import HTTPBadRequest

from rex.core import get_packages, get_settings, Extension
from rex.db import get_db
from rex.web import render_to_response

from .keypath import KeyPathVal
from .transitionable import encode, select, SelectError
from .chrome import get_chrome

__all__ = ('render',)


class Bootstrap(Extension):

    name = None

    @classmethod
    def sanitize(cls):
        assert cls.name is None or isinstance(cls.name, str)

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def signature(cls):
        return cls.name

    def __call__(self, req):
        raise NotImplementedError("%s.__call__()"
                                  % self.__class__.__name__)


BUNDLE_ROOT_PATH = '/www/bundle'
BUNDLE_JS_PATH = '/www/bundle/bundle.js'
BUNDLE_CSS_PATH = '/www/bundle/bundle.css'
BUNDLE_MANIFEST_PATH = '/www/bundle/asset-manifest.json'


Bundle = namedtuple('Bundle', ['root', 'js', 'css'])


def find_bundle():
    """ Return either a bundle or None for currently running app."""
    packages = get_packages()
    root = css = js = None
    www = '/www'
    for package in packages:
        if not package.exists(BUNDLE_ROOT_PATH):
            continue

        root = '%s:%s' % (package.name, BUNDLE_ROOT_PATH[len(www):])

        # try to read bundle info from manifest
        if package.exists(BUNDLE_MANIFEST_PATH):
            with open(package.abspath(BUNDLE_MANIFEST_PATH), 'r') as f:
                manifest = json.load(f)
            js = manifest.get('main.js')
            css = manifest.get('main.css')
            make_public_path = lambda p: os.path.join(BUNDLE_ROOT_PATH, p)[len(www):]
            if js:
                js = '%s:%s' % (package.name, make_public_path(js))
            if css:
                css = '%s:%s' % (package.name, make_public_path(css))
            return Bundle(root=root, js=js, css=css)

        # fallback to hardcoded paths
        else:
            js_exists = package.exists(BUNDLE_JS_PATH)
            css_exists = package.exists(BUNDLE_CSS_PATH)
            if js_exists or css_exists:
                dist = pkg_resources.get_distribution(package.name)
                if css_exists:
                    css = '%s:%s?v=%s' % (
                        package.name,
                        BUNDLE_CSS_PATH[len(www):],
                        dist.version)
                if js_exists:
                    js = '%s:%s?v=%s' % (
                        package.name,
                        BUNDLE_JS_PATH[len(www):],
                        dist.version)
                return Bundle(root=root, js=js, css=css)


validate_widget_path = KeyPathVal(allow_empty=True)


def render(widget, request,
        template='rex.widget:/templates/index.html',
        path=None,
        title=None,
        no_chrome=False):
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

    :keyword template: Template to use (as a package spec ``pkg.module:/path``)
    :type template: str

    :keyword no_chrome: If ``True`` do not wrap widget in chrome
    :type no_chrome: bool

    :return: WSGI response
    :rtype: :class:`webob.Response`
    """
    if not no_chrome:
        Chrome = get_chrome()
        widget = Chrome.validated(content=widget, title=title)
    if path:
        path = validate_widget_path(path)
        try:
            widget = select(widget, request, path)
        except SelectError as err:
            raise HTTPBadRequest('invalid path "%s" at key "%s"' % \
                                 ('.'.join(str(segment) for segment in path), err.key))
        if not hasattr(widget, 'respond') or not callable(widget.respond):
            raise HTTPBadRequest('unable to locate responder via selector')
        return widget.respond(request)
    else:
        settings = get_settings()
        accept = request.accept.best_match(['text/html', 'application/json'])
        payload = encode(widget, request)
        theme = encode(settings.rex_widget.theme, request)
        if accept == 'application/json':
            return Response(payload, content_type='application/json')
        else:
            user = get_db().produce('$USER').data
            bootstrap = [item() for item in Bootstrap.all()]
            return render_to_response(
                template, request,
                user=json.dumps(json.dumps(user)),
                bundle=find_bundle(),
                theme=theme,
                bootstrap=bootstrap,
                payload=payload)
