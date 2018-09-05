#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import get_packages, cached, get_settings, Error
from .handle import HandleFile
from .route import url_for, make_sentry_script_tag
from .auth import authenticate
from .csrf import retain_csrf_token, make_csrf_meta_tag, make_csrf_input_tag
from webob import Response
import collections
import pkg_resources
import os.path
import mimetypes
import urllib.request, urllib.parse, urllib.error
import json
import re
import jinja2


class HandleTemplate(HandleFile):
    """
    Renders a file as a Jinja template.

    This is an abstract implementation of :class:`.HandleFile`.
    To make a concrete implementation, define a subclass and
    set attributes :attr:`ext` and :attr:`content_type`.
    """

    #: File extension.
    ext = None
    #: File content type, ``None`` to guess from the extension.
    content_type = None

    def __call__(self, req):
        return render_to_response(self.path, req,
                                  content_type=self.content_type)


class HandleHTML(HandleTemplate):

    ext = '.html'
    content_type = 'text/html'


class HandleJS(HandleTemplate):

    ext = '.js_t'
    content_type = 'application/javascript'


class HandleCSS(HandleTemplate):

    ext = '.css_t'
    content_type = 'text/css'


class RexJinjaEnvironment(jinja2.Environment):
    # Jinja environment with support for package paths.

    def join_path(self, template, parent):
        # Joins two package paths.
        if ':' not in template:
            # Package name is not specified.
            if template.startswith('/'):
                # For absolute paths, take the package name from the parent.
                if ':' in parent:
                    package, path = parent.split(':', 1)
                    template = "%s:%s" % (package, template)
            else:
                # For relative paths, take the package name from the parent
                # and resolve the path relative to the parent path.
                if ':' in parent:
                    package, parent_path = parent.split(':', 1)
                else:
                    # Should never happen.
                    package = None
                    parent_path = parent
                parent_path = os.path.dirname(parent_path)
                template = os.path.join(parent_path, template)
                if package is not None:
                    template = "%s:%s" % (package, template)
        return template


class RexJinjaLoader(jinja2.BaseLoader):
    # Jinja loader with support for package paths.

    def get_source(self, environment, template):
        packages = get_packages()
        real_path = packages.abspath(template)
        if real_path is None or not os.path.isfile(real_path):
            raise jinja2.TemplateNotFound(template)
        stream = open(real_path)
        source = stream.read()
        stream.close()
        mtime = os.path.getmtime(real_path)
        uptodate = (lambda real_path=real_path, mtime=mtime:
                        os.path.getmtime(real_path) == mtime)
        return (source, real_path, uptodate)


def jinja_filter_json(value):
    """
    Jinja filter ``json`` that serializes the input value to JSON.

    Characters ``<``, ``>``, and ``&`` are escaped so the output is safe
    to use in the ``<script>`` block.
    """
    return json.dumps(value, sort_keys=True).replace('<', '\\u003c') \
                                            .replace('>', '\\u003e') \
                                            .replace('&', '\\u0026')


def _quote(value):
    # Percent-encodes the given value.
    if not isinstance(value, str):
        value = str(value)
    return str(urllib.parse.quote(value, safe=''))


def jinja_filter_urlencode(value):
    """
    Jinja filter ``urlencode`` (``ue``) that percent-encodes the given
    string.  Can accept regular strings, dictionaries or pairwise
    iterables.

    Works just like the standard ``urlencode`` filter, but also escapes
    the ``/`` character.
    """
    if isinstance(value, str):
        return _quote(value)
    else:
        if isinstance(value, dict):
            items = iter(value.items())
        else:
            try:
                items = iter(value)
            except TypeError:
                return _quote(value)
        return '&'.join(_quote(k)+'='+_quote(v)
                         for k, v in items)


@jinja2.contextfilter
def jinja_filter_url(context, value):
    """
    Jinja filter ``url`` that converts a path of the form
    ``package:/path/to/resource`` to URL
    ``http://mount-point/path/to/resource``.
    """
    return url_for(context['REQUEST'], value)


@cached
def get_jinja():
    """
    Returns a Jinja environment suitable for use with RexDB applications.

    The standard Jinja environment was modified to support RexDB package
    paths.  Additionally, the following extensions are enabled:

    ``jinja.ext.do``
        Adds ``do`` tag
        (http://jinja.pocoo.org/docs/extensions/#expression-statement).

    ``jinja.ext.loopcontrols``
        Adds ``break`` and ``continue`` keywords
        (http://jinja.pocoo.org/docs/extensions/#loop-controls).

    The following filters are added:

    * :func:`.jinja_filter_json()`.
    * :func:`.jinja_filter_urlencode()`.
    * :func:`.jinja_filter_url()`.

    The following tests are added: *none*.

    The following global functions are added: *none*.

    The following aliases are added:

    * ``ue`` as an alias for ``urlencode`` filter
      (http://jinja.pocoo.org/docs/templates/#urlencode).
    """
    jinja = RexJinjaEnvironment(
            extensions=[
                # Add more extensions here.
                'jinja2.ext.do',
                'jinja2.ext.loopcontrols',
            ],
            loader=RexJinjaLoader())
    jinja.filters.update({
            # Add more filters here.
            'json': jinja_filter_json,
            'urlencode': jinja_filter_urlencode,
            'ue': jinja_filter_urlencode,
            'url': jinja_filter_url,
    })
    jinja.globals.update({
            # Add more globals here.
    })
    jinja.tests.update({
            # Add more tests here.
    })
    return jinja


class lazy:
    # Lazy object proxy.  Used to evaluate template variables on demand.

    def __init__(self, fn):
        self._fn = fn

    def __call__(self):
        if not hasattr(self, '_obj'):
            self._obj = self._fn()
        return self._obj

    def __str__(self):
        return str(self())


def render_to_response(package_path, req,
                       status=None, content_type=None,
                       **arguments):
    """
    Renders a template; returns an HTTP response object.

    `package_path`
        Path to the template in ``<package>:<path>`` format.
    `req`
        HTTP request object.
    `status`
        HTTP status code (``200`` if not set).
    `content_type`
        Content type of the response; guess from the template extension
        if not set.
    `arguments`
        Template parameters.

    Additional parameters passed to the template:

    `CSRF_INPUT_TAG`
        ``<input>`` tag containing the value of the CSRF token.
    `CSRF_META_TAG`
        ``<meta>`` tag containing the value of the CSRF token.
    `CSRF_TOKEN`
        CSRF token associated with the user session.
    `MOUNT`
        Package mount table mapping package names to absolute URLs.
        This attribute is available only after the request is processed by
        ``SessionManager``.
    `PACKAGE`
        The package that handles the request.  This attribute is only available
        after the request is processed by ``SegmentMapper``.
    `PACKAGE_URL`
        The URL of the package that handles the request.  This attribute is only
        available after the request is processed by ``SegmentMapper``.
    `PARAMS`
        Parameters from the query string and request body.
    `PATH`
        The path of the request, without host or query string.
    `PATH_QS`
        The path of the request, without host, but with a query string.
    `PATH_URL`
        The URL of the request, without the query string.
    `REQUEST`
        HTTP request object.
    `SENTRY_SCRIPT_TAG`
        An HTML snippet that enables front-end Sentry integration.
    `SETTINGS`
        Application configuration.
    `URL`
        Absolute URL of the request.
    `USER`
        The user associated with the request.
    """
    jinja = get_jinja()
    template = jinja.get_template(package_path)
    CSRF_INPUT_TAG = lazy(lambda req=req: make_csrf_input_tag(req))
    CSRF_META_TAG = lazy(lambda req=req: make_csrf_meta_tag(req))
    CSRF_TOKEN = lazy(lambda req=req: retain_csrf_token(req))
    MOUNT = req.environ.get('rex.mount', {})
    PACKAGE = req.environ.get('rex.package')
    PACKAGE_URL = MOUNT.get(PACKAGE)
    PARAMS = req.params
    PATH = req.path
    PATH_QS = req.path_qs
    PATH_URL = req.path_url
    REQUEST = req
    SENTRY_SCRIPT_TAG = lazy(lambda req=req: make_sentry_script_tag(req))
    SETTINGS = get_settings()
    URL = req.url
    USER = authenticate(req)
    body = template.render(
            CSRF_INPUT_TAG=CSRF_INPUT_TAG,
            CSRF_META_TAG=CSRF_META_TAG,
            CSRF_TOKEN=CSRF_TOKEN,
            MOUNT=MOUNT,
            PACKAGE=PACKAGE,
            PACKAGE_URL=PACKAGE_URL,
            PARAMS=PARAMS,
            PATH=PATH,
            PATH_QS=PATH_QS,
            PATH_URL=PATH_URL,
            REQUEST=REQUEST,
            SENTRY_SCRIPT_TAG=SENTRY_SCRIPT_TAG,
            URL=URL,
            USER=USER,
            SETTINGS=SETTINGS,
            **arguments)
    if status is None:
        status = 200
    if content_type is None:
        content_type = mimetypes.guess_type(package_path)[0]
    if content_type is None:
        content_type = 'application/octet-stream'
    return Response(body=body, status=status,
                    content_type=content_type, charset='UTF-8')



ASSET_BUNDLE_ROOT_PATH = '/www/bundle'
ASSET_BUNDLE_JS_PATH = '/www/bundle/bundle.js'
ASSET_BUNDLE_CSS_PATH = '/www/bundle/bundle.css'
ASSET_BUNDLE_MANIFEST_PATH = '/www/bundle/asset-manifest.json'


AssetsBundle = collections.namedtuple('AssetsBundle', ['root', 'js', 'css'])


def find_assets_bundle(package_name=None):
    """ Return either a bundle description or ``None`` for the currently running app.

    If ``package_name`` is provided then the bundle info from this package will be
    returned (if found), otherwise the first found bundle info is returned.
    """
    packages = get_packages()
    if package_name is not None:
        packages = [pkg for pkg in packages if pkg.name == package_name]
    root = css = js = None
    www = '/www'
    for package in packages:
        if not package.exists(ASSET_BUNDLE_ROOT_PATH):
            continue

        root = '%s:%s' % (package.name, ASSET_BUNDLE_ROOT_PATH[len(www):])

        # try to read bundle info from manifest
        if package.exists(ASSET_BUNDLE_MANIFEST_PATH):
            with open(package.abspath(ASSET_BUNDLE_MANIFEST_PATH), 'r') as f:
                manifest = json.load(f)
            js = manifest.get('main.js')
            css = manifest.get('main.css')
            make_public_path = lambda p: os.path.join(ASSET_BUNDLE_ROOT_PATH, p)[len(www):]
            if js:
                js = '%s:%s' % (package.name, make_public_path(js))
            if css:
                css = '%s:%s' % (package.name, make_public_path(css))
            return AssetsBundle(root=root, js=js, css=css)

        # fallback to hardcoded paths
        else:
            js_exists = package.exists(ASSET_BUNDLE_JS_PATH)
            css_exists = package.exists(ASSET_BUNDLE_CSS_PATH)
            if js_exists or css_exists:
                dist = pkg_resources.get_distribution(package.name)
                if css_exists:
                    css = '%s:%s?v=%s' % (
                        package.name,
                        ASSET_BUNDLE_CSS_PATH[len(www):],
                        dist.version)
                if js_exists:
                    js = '%s:%s?v=%s' % (
                        package.name,
                        ASSET_BUNDLE_JS_PATH[len(www):],
                        dist.version)
                return AssetsBundle(root=root, js=js, css=css)
