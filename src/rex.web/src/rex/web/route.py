#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Setting, Extension, WSGI, get_packages, get_settings,
        MapVal, OMapVal, ChoiceVal, StrVal, Error)
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
import yaml


class MountSetting(Setting):
    """
    Mount table that maps package names to path segments.

    For each package, this setting specifies the base URL segment
    for commands and static resources that belong to the package.
    The value of this setting is a dictionary; the keys are package
    names, the values are URL segments.

    Example::

        mount:
            rex.web_demo:   /
            rex.common:     /shared/

    It is not an error to omit some packages or the whole setting entirely.
    If the mount point for a package is not specified, it is determined
    as follows:

    1. The first package in the application requirement list is mounted
       at ``/``.
    2. Otherwise, a normalized package name is used as the mount point.
    """

    name = 'mount'

    def default(self):
        return self.validate(None)

    def validate(self, value):
        if value is None:
            value = {}
        # The package to mount at ``/``.
        root_name = get_packages()[0].name
        # All packages with servable content.
        package_names = [package.name
                         for package in get_packages()
                         if package.exists('www') or
                            HandleLocation.by_package(package)]
        # Check if the raw setting value is well-formed.
        mount_val = MapVal(ChoiceVal(*package_names),
                           StrVal('^/(?:[0-9A-Aa-z~!@$^*+=:,._-]+/?)?$'))
        value = mount_val(value)
        # Rebuild the mount table.
        mount = {}
        seen = set()
        for name in package_names:
            if name in value:
                segment = value[name]
            elif name == root_name:
                segment = '/'
            else:
                segment = name.split('.')[-1].replace('_', '-')
            segment = segment.strip('/')
            if segment in seen:
                raise Error("Got duplicate mount URL:", '/'+segment)
            seen.add(segment)
            mount[name] = segment
        return mount


class SessionManager(object):
    # Adds `session` and `mount` attributes to the request object.

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
        req.session = copy.deepcopy(session)
        # Build package mount table.
        req.mount = {}
        for name, segment in get_settings().mount.items():
            if segment:
                req.mount[name] = req.application_url+"/"+segment
            else:
                req.mount[name] = req.application_url
        # Process the request.
        resp = self.trunk(req)
        # Update the session if necessary.
        if req.session != session:
            if not req.session:
                resp.delete_cookie(self.SESSION_COOKIE,
                                   path=req.script_name+'/')
            else:
                session_json = json.dumps(req.session)
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


class PackageRouter(object):
    # Determines which package handles the request.

    def __init__(self, route_map, fallback=None):
        # Maps URL segments to handlers.
        self.route_map = route_map
        # Fallback handler.
        self.fallback = fallback

    def __call__(self, req):
        segment = req.path_info_peek()

        if segment in self.route_map:
            # Preserve the original request object.
            req = req.copy()
            req.path_info_pop()
            route = self.route_map[segment]
            return route(req)

        if self.fallback is not None:
            return self.fallback(req)

        raise HTTPNotFound()


class StaticServer(object):
    # Handles static resources.

    # Directory index.
    index_file = 'index.html'
    # Default permission.
    default_access = 'authenticated'
    # File that maps file patterns to permissions.
    access_file = '/_access.yaml'

    def __init__(self, root, file_handler_map, fallback=None):
        # The root directory (in `<package>:<local_path>` format)
        self.root = root
        # Maps file extensions to handler types.
        self.file_handler_map = file_handler_map
        # Handler to call when file is not found.
        self.fallback = fallback

    def __call__(self, req):
        # Normalize the URL.
        url = req.path_info
        url = os.path.normpath(url)

        # Immediately reject anything starting with `.` or `_`.
        for segment in url.split('/'):
            if segment.startswith('.') or segment.startswith('_'):
                raise HTTPNotFound()

        # Convert the URL into the filesystem path.
        package_path = self.root + url
        packages = get_packages()
        real_path = packages.abspath(package_path)

        # If the URL refers to a directory without trailing `/`,
        # redirect to url+'/'.
        if os.path.isdir(real_path) and not req.path_url.endswith('/'):
            location = req.path_url+'/'
            if req.query_string:
                location += '?'+req.query_string
            # FIXME: should we check permissions first?
            return Response(status=301, location=location)

        # Otherwise, we will serve `index_file`.
        if os.path.isdir(real_path) and \
                os.path.isfile(os.path.join(real_path, self.index_file)):
            url = os.path.join(url, self.index_file)
            package_path = os.path.join(package_path, self.index_file)
            real_path = os.path.join(real_path, self.index_file)

        # We found the file to serve.
        if os.path.isfile(real_path):
            # Detemine and check access permissions for the requested URL.
            access = self.default_access
            access_path = self.root + self.access_file
            if packages.exists(access_path):
                access_map = yaml.safe_load(packages.open(access_path))
                access_val = OMapVal(StrVal(), StrVal())
                access_map = access_val(access_map)
                for pattern in access_map:
                    if fnmatch.fnmatchcase(url, pattern):
                        access = access_map[pattern]
                        break
            if not authorize(req, access):
                raise HTTPUnauthorized()
            # Find and execute the handler by file extension.
            ext = os.path.splitext(real_path)[1]
            if ext in self.file_handler_map:
                handler = self.file_handler_map[ext](package_path)
            else:
                handler = FileApp(real_path)
            return handler(req)

        # If file not found, delegate to the fallback or return 404.
        if self.fallback is not None:
            return self.fallback(req)
        raise HTTPNotFound()


class CommandDispatcher(object):
    # Routes the request to `HandleLocation` implementations.

    def __init__(self, location_handler_map, fallback=None):
        # Maps URLs to handler types.
        self.location_handler_map = location_handler_map
        # Default handler.
        self.fallback = fallback

    def __call__(self, req):
        path = req.path_info

        if path in self.location_handler_map:
            handler = self.location_handler_map[path]()
            return handler(req)

        if '*' in self.location_handler_map:
            handler = self.location_handler_map['*']()
            return handler(req)

        if self.fallback is not None:
            return self.fallback(req)
        raise HTTPNotFound()


class StandardWSGI(WSGI):

    @classmethod
    def build(cls):
        # Builds routing pipeline.

        # Package mount table.
        mount = get_settings().mount

        # File handlers shared by all packages.
        file_handler_map = HandleFile.map_all()

        # Prepare routing map for `PackageRouter`.
        packages = get_packages()
        default = None
        route_map = {}
        for package in packages:
            route = None
            # Place `CommandDispatcher` at the bottom of the stack.
            location_handler_map = HandleLocation.map_by_package(package.name)
            if location_handler_map:
                route = CommandDispatcher(location_handler_map, route)
            # Place `StaticServer` on top of it.
            if package.exists('www'):
                root = "%s:/www" % package.name
                route = StaticServer(root, file_handler_map, route)
            # Add to the routing table.
            if route is not None:
                if mount[package.name]:
                    route_map[mount[package.name]] = route
                else:
                    default = route
        router = PackageRouter(route_map, default)
        # Place `ErrorCatcher` and `SessionManager` above all.
        error_handler_map = HandleError.map_all()
        catcher = ErrorCatcher(router, error_handler_map)
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


