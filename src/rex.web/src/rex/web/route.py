#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import (Setting, Extension, WSGI, get_packages, get_settings,
        MaybeVal, MapVal, OMapVal, ChoiceVal, StrVal, Error, cached,
        autoreload, get_rex, get_sentry)
from .handle import HandleFile, HandleLocation, HandleError
from .auth import authenticate, authorize, confine
from .path import PathMap, PathMask
from .secret import encrypt_and_sign, validate_and_decrypt
from webob import Request, Response
from webob.exc import (WSGIHTTPException, HTTPNotFound, HTTPUnauthorized,
        HTTPMovedPermanently, HTTPMethodNotAllowed)
from webob.static import FileIter, BLOCK_SIZE
import sys
import copy
import os
import fnmatch
import json
import datetime
import wsgiref
import cgitb
import mimetypes
import marshal
import fcntl
import io
import socket
import urllib.parse
import raven.utils.wsgi


class ReplayLogSetting(Setting):
    """
    File to log all incoming requests.

    Example::

        replay_log: replay.log

    Use the ``rex replay`` task to replay the sequence of requests
    from an existing replay log.
    """

    name = 'replay_log'
    validate = MaybeVal(StrVal)
    default = None


class MountSetting(Setting):
    """
    Mount table that maps package names to path segments.

    For each package, this setting specifies the base URL segment
    for commands and static resources that belong to the package.
    The value of this setting is a dictionary; the keys are package
    names, the values are URL segments.

    Example::

        mount:
            rex.web_demo:   /demo/

    It is not an error to omit some packages or the whole setting entirely.
    If the mount point for a package is not specified, it is determined
    as follows:

    1. The first package in the application requirement list is mounted
       at ``/``.
    2. Otherwise, a normalized package name is used as the mount point.

    It is permitted for two or more packages to share the mount point.
    When several packages are mounted at the same URL segment, the request
    is handled by the first package that contains a command or a static
    resource that matches the URL.

    This setting could be specified more than once.  Mount tables preset
    by different packages are merged into one.
    """

    name = 'mount'

    def merge(self, old_value, new_value):
        # Verify and merge dictionaries.
        map_val = MapVal()
        value = {}
        value.update(map_val(old_value))
        value.update(map_val(new_value))
        return value

    def default(self):
        return self.validate({})

    def validate(self, value):
        # The package to mount at ``/``.
        root_name = get_packages()[0].name
        # All packages (not necessarily with servable content).
        package_names = [package.name for package in get_packages()]
        # Check if the raw setting value is well-formed.
        mount_val = MapVal(ChoiceVal(*package_names),
                           StrVal('^/(?:[0-9A-Aa-z~!@$^*+=:,._-]+/?)?$'))
        value = mount_val(value)
        # Rebuild the mount table.
        mount = {}
        for name in package_names:
            if name in value:
                segment = value[name]
            elif name == root_name:
                segment = '/'
            else:
                segment = name.split('.')[-1].replace('_', '-')
            segment = segment.strip('/')
            mount[name] = segment
        return mount


class Pipe(Extension):
    """
    Implements a component of the request pipeline.

    `handle`
        The next component in the pipeline.
    """

    @classmethod
    def enabled(cls):
        return (cls is not Pipe)

    def __init__(self, handle):
        self.handle = handle

    def __call__(self, req):
        """
        Processes the request.  Implementations must override this method.
        """
        return self.handle(req)


class PipeSession(Pipe):
    # Adds `rex.session` and `rex.mount` to the request environment.

    priority = 'session'

    SESSION_COOKIE = 'rex.session'

    def __call__(self, req):
        # Do not mangle the original request object.
        req = req.copy()
        # Extract session data from the encrypted cookie.
        session = {}
        if self.SESSION_COOKIE in req.cookies:
            session_cookie = req.cookies[self.SESSION_COOKIE]
            session_json = validate_and_decrypt(session_cookie)
            if session_json is not None:
                session = json.loads(session_json)
                assert isinstance(session, dict)
        req.environ['rex.session'] = copy.deepcopy(session)
        # Build package mount table.
        mount = {}
        for name, segment in list(get_settings().mount.items()):
            if segment:
                mount[name] = req.application_url+"/"+segment
            else:
                mount[name] = req.application_url
        req.environ['rex.mount'] = mount
        # Process the request.
        resp = self.handle(req)
        # Update the session cookie if necessary.
        new_session = req.environ['rex.session']
        if new_session != session:
            if not new_session:
                resp.delete_cookie(self.SESSION_COOKIE,
                                   path=req.script_name+'/')
            else:
                session_json = json.dumps(new_session)
                session_cookie = encrypt_and_sign(session_json)
                assert len(session_cookie) < 4096, \
                        "session data is too large"
                resp.set_cookie(self.SESSION_COOKIE,
                                session_cookie,
                                path=req.script_name+'/',
                                secure=(req.scheme == 'https'),
                                httponly=True)
        return resp


class PipeError(Pipe):
    # Catches HTTP exceptions and delegates them to appropriate `HandlError`.

    priority = 'error'
    after = 'session'

    def __init__(self, handle):
        super(PipeError, self).__init__(handle)
        # Maps error codes to handler types.
        self.error_handler_map = HandleError.mapped()

    def __call__(self, req):
        try:
            return self.handle(req)
        except WSGIHTTPException as error:
            if error.code in self.error_handler_map:
                # Handler for a specific error code.
                handler = self.error_handler_map[error.code](error)
                return handler(req)
            elif '*' in self.error_handler_map:
                # Catch-all handler.
                handler = self.error_handler_map['*'](error)
                return handler(req)
            else:
                raise


class PipeRouting(Pipe):
    # Forwards the request to the routing table.

    priority = 'routing'
    after = 'error'

    def __init__(self, handle):
        super(PipeRouting, self).__init__(handle)
        # Maps URL segments to handlers.
        self.route_map = get_routes(None)

    def __call__(self, req):
        segment = req.path_info_peek()

        if segment and segment in self.route_map:
            # Preserve the original request object.
            req = req.copy()
            req.path_info_pop()
            route = self.route_map[segment]
            return route(req)
        elif '' in self.route_map:
            route = self.route_map['']
            return route(req)

        return self.handle(req)


def not_found(req):
    """
    Raises 404.  Use as the default fallback.
    """
    raise HTTPNotFound()


class RoutingTable:
    # Adds `rex.package` to the request environment and dispatches
    # the request to the command or some other handler.

    def __init__(self, package, fallback=None):
        # The package.
        self.package = package
        # The next handler.
        self.fallback = fallback or not_found

    def __call__(self, req):
        handle_map = get_routes(self.package)
        handle = handle_map.get(req.path_info)
        if handle is not None:
            # Add `rex.package` to the request environment
            # without mangling the original request object.
            req = req.copy()
            req.environ['rex.package'] = self.package.name
            return handle(req)
        # Redirect to `<path>/` if there is a handler.
        if handle_map.completes(req.path_info):
            return HTTPMovedPermanently(add_slash=True)
        # Delegate the request to the fallback.
        return self.fallback(req)


class StaticGuard:
    # Verifies if the path can be handled by `StaticServer`.

    def __init__(self, package):
        self.package = package

    def __call__(self, path):
        # Normalize the URL.
        if path.endswith('/'):
            path += StaticServer.index_file
        path = os.path.normpath(path)

        # Immediately reject anything starting with `.` or `_`.
        if any(segment.startswith('.') for segment in path.split('/')):
            return False
        if not self.package.exists('www.yaml'):
            if any(segment.startswith('_') for segment in path.split('/')):
                return False

        # Convert the URL into the filesystem path.
        local_path = StaticServer.www_root + path
        real_path = self.package.abspath(local_path)

        return os.path.isfile(real_path)


class StaticServer:
    # Handles static resources.

    # Directory index.
    index_file = 'index.html'
    # File that maps file patterns to permissions.
    access_file = '/_access.yaml'
    # Format validator for the access file.
    access_val = OMapVal(StrVal(), StrVal())
    # Directory published on HTTP.
    www_root = '/www'

    def __init__(self, package, file_handler_map):
        self.package = package
        # Maps file extensions to handler types.
        self.file_handler_map = file_handler_map

    def __call__(self, req):
        # Normalize the URL.
        url = req.path_info
        if url.endswith('/'):
            url += self.index_file
        url = os.path.normpath(url)

        # Path containing `/.` should have been rejected by the guard.
        assert not any(segment.startswith('.')
                       for segment in url.split('/'))

        # Convert the URL into the filesystem path.
        local_path = self.www_root + url
        real_path = self.package.abspath(local_path)
        assert os.path.isfile(real_path)

        # Detemine and check access permissions for the requested URL.
        access = None
        if not self.package.exists('www.yaml'):
            access_path = self.www_root + self.access_file
            if self.package.exists(access_path):
                access_map = self.access_val.parse(
                        self.package.open(access_path))
                for pattern in access_map:
                    if fnmatch.fnmatchcase(url, pattern):
                        access = access_map[pattern]
                        break
        if access is None:
            access = self.package
        if not authorize(req, access):
            raise HTTPUnauthorized()
        # Find and execute the handler by file extension.
        ext = os.path.splitext(real_path)[1]
        if ext in self.file_handler_map:
            package_path = "%s:%s" % (self.package.name, local_path)
            handler = self.file_handler_map[ext](package_path)
            with confine(req, access):
                return handler(req)
        else:
            if req.method not in ('GET', 'HEAD'):
                raise HTTPMethodNotAllowed()
            stream = open(real_path, 'rb')
            if 'wsgi.file_wrapper' in req.environ:
                app_iter = req.environ['wsgi.file_wrapper'] \
                        (stream, BLOCK_SIZE)
            else:
                app_iter = FileIter(stream)
            content_type, content_encoding = \
                    mimetypes.guess_type(real_path)
            stat = os.fstat(stream.fileno())
            return Response(
                    app_iter=app_iter,
                    content_type=content_type or 'application/octet-stream',
                    content_encoding=content_encoding,
                    last_modified=stat.st_mtime,
                    content_length=stat.st_size,
                    accept_ranges='bytes',
                    cache_control='private',
                    conditional_response=True)


class CommandDispatcher:
    # Routes the request to a `HandleLocation` implementation.

    def __init__(self, handler_type):
        self.handler_type = handler_type

    def __call__(self, req):
        handler = self.handler_type()
        return handler(req)


class Route(Extension):
    """
    Interface for generating package routing table.

    `open`
        A wrapper over ``open()`` function to be used for opening
        source files.
    """

    @classmethod
    def enabled(cls):
        return (cls is not Route)

    def __init__(self, open=open):
        self.open = open

    def __call__(self, package):
        """
        Generates a routing table for the given package.

        Implementations must override this method.
        """
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)


class RouteFiles(Route):
    # Adds a handler for serving files from `static/www` directory.

    priority = [10, 'files']

    def __call__(self, package):
        path_map = PathMap()
        if package.exists(StaticServer.www_root):
            file_handler_map = HandleFile.mapped()
            server = StaticServer(package, file_handler_map)
            guard = StaticGuard(package)
            mask = PathMask('/**', guard)
            path_map.add(mask, server)
        return path_map


class RouteCommands(Route):
    # Adds `HandleLocation` and `Command` handlers.

    priority = [20, 'commands']

    def __call__(self, package):
        path_map = PathMap()
        for extension in HandleLocation.all(package):
            path_map.add(extension.path, CommandDispatcher(extension))
        return path_map


class StandardWSGI(WSGI):

    @classmethod
    def build(cls):
        # Builds routing pipeline.

        # Package mount table.
        mount = get_settings().mount

        # Generators for package routing pipeline.
        pipe = not_found
        for pipe_type in reversed(Pipe.ordered()):
            pipe = pipe_type(pipe)

        return cls(pipe)

    def __init__(self, handler):
        rex = get_rex()
        self.handler = handler
        self.sentry = get_sentry(
                context={
                    'requirements': rex.requirements,
                    'parameters': rex.parameters })
        settings = get_settings()
        self.replay_log = None
        if settings.replay_log:
            self.replay_log = open(settings.replay_log, 'ab')

    def __call__(self, environ, start_response):
        # Fix for uWSGI not stripping SCRIPT_NAME from PATH_INFO.
        if (urllib.parse.unquote(environ.get('REQUEST_URI', '')).startswith(environ.get('PATH_INFO', '')) and
                environ.get('PATH_INFO', '').startswith(environ.get('SCRIPT_NAME', ''))):
            environ['PATH_INFO'] = environ.get('PATH_INFO', '')[len(environ.get('SCRIPT_NAME', '')):]
        # Workaround for uWSGI leaving an extra `/` on SCRIPT_NAME.
        if (environ.get('SCRIPT_NAME', '').endswith('/') and
                environ.get('PATH_INFO', '').startswith('/')):
            environ['SCRIPT_NAME'] = environ['SCRIPT_NAME'][:-1]
        # Another UWSGI bug.
        if (len(environ.get('SCRIPT_NAME', '')) > 0 and
                len(environ.get('PATH_INFO', '')) == 1 and
                environ.get('PATH_INFO')[0] != '/'):
            environ['SCRIPT_NAME'] = environ['SCRIPT_NAME'] + environ['PATH_INFO']
            environ['PATH_INFO'] = ''
        # Update replay log.
        if self.replay_log is not None:
            entry = {}
            for key, value in list(environ.items()):
                if isinstance(value, (str, int, bool, tuple)):
                    entry[key] = value
                elif key == 'wsgi.input':
                    try:
                        content_length = int(environ.get('CONTENT_LENGTH', 0))
                    except ValueError:
                        content_length = 0
                    if content_length > 0:
                        data = value.read(content_length)
                        entry[key] = data
                        environ[key] = io.StringIO(data)
            try:
                fcntl.flock(self.replay_log, fcntl.LOCK_EX)
                marshal.dump(entry, self.replay_log)
                self.replay_log.flush()
            finally:
                fcntl.flock(self.replay_log, fcntl.LOCK_UN)
        # Sentry configuration.
        self.sentry.user_context({
            'id': environ.get('REMOTE_USER'),
            'ip_address': environ.get('REMOTE_ADDR') })
        self.sentry.http_context({
            'method': environ.get('REQUEST_METHOD'),
            'url': raven.utils.wsgi.get_current_url(
                    environ, strip_querystring=True),
            'query_string': environ.get('QUERY_STRING'),
            'headers': dict(raven.utils.wsgi.get_headers(environ)),
            'env': dict(raven.utils.wsgi.get_environ(environ)) })
        data = self.sentry.context.data
        environ['rex.sentry'] = self.sentry
        # Bridge between WSGI and WebOb.
        req = Request(environ)
        try:
            try:
                resp = self.handler(req)
            except WSGIHTTPException as exc:
                resp = exc
            except:
                self.sentry.captureException()
                write = start_response(
                        "500 Internal Server Error",
                        [("Content-Type", 'text/plain')])
                if write:
                    write(b"The server encountered an unexpected condition"
                          b" which prevented it from fulfilling the request.\n")
                    if get_settings().debug:
                        exc_info = sys.exc_info()
                        write(("\n[%s] %s %s\n"
                               % (datetime.datetime.now(),
                                  environ['REQUEST_METHOD'],
                                  wsgiref.util.request_uri(environ))).encode('utf-8'))
                        write(cgitb.text(exc_info).encode('utf-8'))
                raise
        finally:
            self.sentry.context.clear()
            self.sentry.transaction.clear()
        return resp(environ, start_response)


def url_for(req, package_url):
    """
    Converts a package URL to an absolute URL.

    `req`
        HTTP request object.
    `package_url`
        Package URL composed of the package name and a relative URL
        separated by ``:``: ``package:/path/to/resource``.  If the package name
        is omitted, the package that handles the current request is assumed.

        If the URL starts with ``http://`` or ``https://``, it is returned
        as is.
    """
    if package_url.startswith('http://') or package_url.startswith('https://'):
        url = package_url
    else:
        mount = req.environ.get('rex.mount', {})
        package = req.environ.get('rex.package')
        if ':' in package_url:
            package, local_url = package_url.split(':', 1)
        else:
            local_url = package_url
        if not local_url.startswith('/'):
            local_url = '/'+local_url
        prefix = mount.get(package)
        if not prefix:
            raise Error("Could not find the mount point for:", package_url)
        url = prefix+local_url
    return url


@autoreload
def get_routes(package, open=open):
    """
    Returns the routing table for the given package.
    """
    if package is not None:
        # Build a URL map for an individual package.
        handle_map = PathMap()
        for route_type in reversed(Route.ordered()):
            route = route_type(open)
            handle_map.update(route(package))
        return handle_map
    else:
        # Prepare routing map for `PipePackage`.
        mount = get_settings().mount
        route_map = {}
        for package in reversed(get_packages()):
            # Mount point and its handler.
            segment = mount[package.name]
            route = route_map.get(segment)
            # Generate routing map for the package.
            if get_routes(package):
                # To enable autoreloading, we don't save the current
                # routing map.
                route = RoutingTable(package, route)
            # Add to the routing table.
            if route is not None:
                route_map[segment] = route
        return route_map


def route(package_url):
    """
    Finds the handler for the given package URL.

    Returns ``None`` if no handler is found.

    `package_url`
        URL in ``'package:/path/to/resource'`` format.
    """
    if ':' not in package_url:
        return None
    package_name, local_url = package_url.split(':', 1)
    packages = get_packages()
    if package_name not in packages:
        return None
    routes = get_routes(packages[package_name])
    return routes.get(local_url)


HOSTNAME = socket.getfqdn()


def make_sentry_script_tag(req):
    """
    Generates an HTML snippet to enable Sentry integration::

        <script src="/web/ravenjs/raven.min.js"></script>
        <script>Raven.config(...).install()</script>
    """
    sentry = req.environ.get('rex.sentry')
    if not sentry:
        return ""
    public_dsn = sentry.get_public_dsn()
    if not public_dsn:
        return ""
    parts = urllib.parse.urlsplit(public_dsn)
    if parts.hostname == HOSTNAME:
        url = urllib.parse.urlsplit(req.host_url)
        netloc = "".join((
            parts.username+'@',
            url.hostname,
            ':'+str(url.port) if url.port else ''))
        public_dsn = urllib.parse.urlunsplit(
                (parts.scheme, netloc, parts.path, parts.query, parts.fragment))
    tags = sentry.tags
    user_context = sentry.context.get().get('user')
    raven = url_for(req, "rex.web:/ravenjs/raven.min.js")
    config = "Raven.config(%s)" % json.dumps(public_dsn)
    if tags:
        config += ".setTagsContext(%s)" % json.dumps(tags)
    if user_context:
        config += ".setUserContext(%s)" % json.dumps(user_context)
    config += ".install();"
    config += " window.onunhandledrejection =" \
        " function(evt) {Raven.captureException(evt.reason);};"
    return """<script src="%s"></script><script>%s</script>""" \
            % (raven, config)


