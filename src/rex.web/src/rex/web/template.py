#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import get_packages, cached, get_settings
from .handle import HandleFile
from .auth import authenticate
from .csrf import retain_csrf_token, make_csrf_meta_tag, make_csrf_input_tag
from webob import Response
import os.path
import mimetypes
import urllib
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
        source = stream.read().decode('utf-8')
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
    return json.dumps(value).replace('<', '\\u003c') \
                            .replace('>', '\\u003e') \
                            .replace('&', '\\u0026')


def _quote(value):
    # Percent-encodes the given value.
    if not isinstance(value, (str, unicode)):
        value = unicode(value)
    if isinstance(value, unicode):
        value = value.encode('utf-8')
    return unicode(urllib.quote(value, safe=''))


def jinja_filter_urlencode(value):
    """
    Jinja filter ``urlencode`` (``ue``) that percent-encodes the given
    string.  Can accept regular strings, dictionaries or pairwise
    iterables.

    Works just like the standard ``urlencode`` filter, but also escapes
    the ``/`` character.
    """
    if isinstance(value, (str, unicode)):
        return _quote(value)
    else:
        if isinstance(value, dict):
            items = value.iteritems()
        else:
            try:
                items = iter(value)
            except TypeError:
                return _quote(value)
        return u'&'.join(_quote(k)+'='+_quote(v)
                         for k, v in items)


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
    })
    jinja.globals.update({
            # Add more globals here.
    })
    jinja.tests.update({
            # Add more tests here.
    })
    return jinja


class lazy(object):
    # Lazy object proxy.  Used to evaluate template variables on demand.

    def __init__(self, fn):
        self._fn = fn

    def __call__(self):
        if not hasattr(self, '_obj'):
            self._obj = self._fn()
        return self._obj

    def __str__(self):
        return str(self())

    def __unicode__(self):
        return unicode(self())


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
    URL = req.url
    USER = authenticate(req)
    SETTINGS = get_settings()
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


