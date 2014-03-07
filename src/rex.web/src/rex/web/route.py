#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import (Setting, Extension, WSGI, get_packages, get_settings,
        MapVal, OMapVal, ChoiceVal, StrVal, Error, cached)
from .handle import HandleFile, HandleLocation, HandleError
from .auth import authenticate, authorize
from .secret import encrypt, decrypt, sign, validate, a2b, b2a
from webob import Request, Response
from webob.exc import WSGIHTTPException, HTTPNotFound, HTTPUnauthorized
from webob.static import FileApp
import copy
import os.path
import fnmatch
import json


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


class SessionManager(object):
    # Adds `rex.session` and `rex.mount` to the request environment.

    SESSION_COOKIE = 'rex.session'

    def __init__(self, trunk):
        self.trunk = trunk

    def __call__(self, req):
        # Do not mangle the original request object.
        req = req.copy()
        # Extract session data from the encrypted cookie.
        session = {}
        if self.SESSION_COOKIE in req.cookies:
            session_cookie = req.cookies[self.SESSION_COOKIE]
            session_json = decrypt(validate(a2b(session_cookie)))
            if session_json is not None:
                session = json.loads(session_json)
                assert isinstance(session, dict)
        req.environ['rex.session'] = copy.deepcopy(session)
        # Build package mount table.
        mount = {}
        for name, segment in get_settings().mount.items():
            if segment:
                mount[name] = req.application_url+"/"+segment
            else:
                mount[name] = req.application_url
        req.environ['rex.mount'] = mount
        # Process the request.
        resp = self.trunk(req)
        # Update the session cookie if necessary.
        new_session = req.environ['rex.session']
        if new_session != session:
            if not new_session:
                resp.delete_cookie(self.SESSION_COOKIE,
                                   path=req.script_name+'/')
            else:
                session_json = json.dumps(new_session)
                session_cookie = b2a(sign(encrypt(session_json)))
                assert len(session_cookie) < 4096, \
                        "session data is too large"
                resp.set_cookie(self.SESSION_COOKIE,
                                session_cookie,
                                path=req.script_name+'/',
                                secure=(req.scheme == 'https'),
                                httponly=True)
        return resp


class ErrorCatcher(object):
    # Catches HTTP exceptions and delegates them to appropriate `HandleError`.

    def __init__(self, trunk, error_handler_map):
        # Main request handler.
        self.trunk = trunk
        # Maps error codes to handler types.
        self.error_handler_map = error_handler_map

    def __call__(self, req):
        try:
            return self.trunk(req)
        except WSGIHTTPException, error:
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


def not_found(req):
    """
    Raises 404.  Use as the default fallback.
    """
    raise HTTPNotFound()


class SegmentMapper(object):
    # Uses the first segment of the URL to determine the request handler.

    def __init__(self, route_map, fallback=None):
        # Maps URL segments to handlers.
        self.route_map = route_map
        # Fallback handler.
        self.fallback = fallback or not_found

    def __call__(self, req):
        segment = req.path_info_peek()

        if segment in self.route_map:
            # Preserve the original request object.
            req = req.copy()
            req.path_info_pop()
            route = self.route_map[segment]
            return route(req)

        return self.fallback(req)


class PackageGate(object):
    # Adds `rex.package` to the request environment.

    def __init__(self, name, fallback=None):
        # Package name.
        self.name = name
        # The next handler.
        self.fallback = fallback or not_found

    def __call__(self, req):
        # Add `rex.package` to the request environment
        # without mangling the original request object.
        req = req.copy()
        req.environ['rex.package'] = self.name
        # Delegate the request.
        return self.fallback(req)


class StaticServer(object):
    # Handles static resources.

    # Directory index.
    index_file = 'index.html'
    # File that maps file patterns to permissions.
    access_file = '/_access.yaml'
    # Format validator for the access file.
    access_val = OMapVal(StrVal(), StrVal())
    # Directory published on HTTP.
    www_root = '/www'

    def __init__(self, package, file_handler_map, fallback=None):
        self.package = package
        # Maps file extensions to handler types.
        self.file_handler_map = file_handler_map
        # Handler to call when no file is found.
        self.fallback = fallback or not_found

    def __call__(self, req):
        # Normalize the URL.
        url = req.path_info
        url = os.path.normpath(url)

        # Immediately reject anything starting with `.` or `_`.
        for segment in url.split('/'):
            if segment.startswith('.') or segment.startswith('_'):
                return self.fallback(req)

        # Convert the URL into the filesystem path.
        local_path = self.www_root + url
        real_path = self.package.abspath(local_path)

        # If the URL refers to a directory without trailing `/`,
        # redirect to url+'/'.
        if os.path.isdir(real_path) and not req.path_url.endswith('/'):
            location = req.path_url+'/'
            if req.query_string:
                location += '?'+req.query_string
            # FIXME: should we check permissions first?  What about POST
            # requests?
            return Response(status=301, location=location)

        # Otherwise, we will serve `index_file`.
        if os.path.isdir(real_path) and \
                os.path.isfile(os.path.join(real_path, self.index_file)):
            url = os.path.join(url, self.index_file)
            local_path = os.path.join(local_path, self.index_file)
            real_path = os.path.join(real_path, self.index_file)

        # We found the file to serve.
        if os.path.isfile(real_path):
            # Detemine and check access permissions for the requested URL.
            access = None
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
            else:
                handler = FileApp(real_path)
            return handler(req)

        # If file not found, delegate to the fallback or return 404.
        return self.fallback(req)


class CommandDispatcher(object):
    # Routes the request to `HandleLocation` implementations.

    def __init__(self, location_handler_map, fallback=None):
        # Maps URLs to handler types.
        self.location_handler_map = location_handler_map
        # Default handler.
        self.fallback = fallback or not_found

    def __call__(self, req):
        handler = self.location_handler_map.get(req.path_info)
        if handler:
            return handler()(req)
        return self.fallback(req)


class Route(Extension):
    """
    Interface for adding a component to the package routing pipeline.
    """

    #: The relative position of the component (lower is earlier).
    priority = None

    @classmethod
    def sanitize(cls):
        # `priority` must be an integer.
        assert cls.priority is None or isinstance(cls.priority, int)

    @classmethod
    def enabled(cls):
        return (cls.priority is not None)

    @classmethod
    @cached
    def ordered(cls):
        """
        Returns implementations in the priority order.
        """
        extensions = cls.all()
        priorities = set([extension.priority for extension in extensions])
        assert len(priorities) == len(extensions)
        return sorted(extensions, key=(lambda e: e.priority))

    def __call__(self, package, fallback):
        """
        Generates a routing component for the given package.

        Implementations must override this method.
        """
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)


class RoutePackage(Route):
    # Sets `rex.package`.

    priority = 0

    def __call__(self, package, fallback):
        if fallback is not None:
            return PackageGate(package.name, fallback)
        return fallback


class RouteFiles(Route):
    # Serves files from `static/www` directory.

    priority = 10

    def __call__(self, package, fallback):
        if package.exists(StaticServer.www_root):
            file_handler_map = HandleFile.map_all()
            return StaticServer(package, file_handler_map, fallback)
        return fallback


class RouteCommands(Route):
    # Routes to `HandleLocation` and `Command` handlers.

    priority = 20

    def __call__(self, package, fallback):
        location_handler_map = HandleLocation.map_by_package(package.name)
        if location_handler_map:
            return CommandDispatcher(location_handler_map, fallback)
        return fallback


class StandardWSGI(WSGI):

    @classmethod
    def build(cls):
        # Builds routing pipeline.

        # Package mount table.
        mount = get_settings().mount

        # Generators for package routing pipeline.
        planners = [route_type() for route_type in Route.ordered()]
        planners.reverse()

        # Prepare routing map for `SegmentMapper`.
        packages = get_packages()
        route_map = {}
        default = None
        for package in reversed(packages):
            # Mount point and its handler.
            segment = mount[package.name]
            if segment:
                route = route_map.get(segment)
            else:
                route = default
            # Generate routing pipeline for the package.
            for planner in planners:
                route = planner(package, route)
            # Add to the routing table.
            if route is not None:
                if segment:
                    route_map[segment] = route
                else:
                    default = route
        mapper = SegmentMapper(route_map, default)
        # Place `ErrorCatcher` and `SessionManager` on top.
        error_handler_map = HandleError.map_all()
        catcher = ErrorCatcher(mapper, error_handler_map)
        manager = SessionManager(catcher)
        return cls(manager)

    def __init__(self, handler):
        self.handler = handler

    def __call__(self, environ, start_response):
        # Bridge between WSGI and WebOb.
        req = Request(environ)
        try:
            resp = self.handler(req)
        except WSGIHTTPException, exc:
            resp = exc
        return resp(environ, start_response)


