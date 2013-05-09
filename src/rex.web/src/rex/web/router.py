#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Extension, WSGI, get_packages
from .handler import FileHandler, PathHandler, ErrorHandler
from .mount import get_mount
from webob import Request, Response
from webob.exc import WSGIHTTPException, HTTPNotFound
from beaker.session import SessionObject
from .auth import authenticate, authorize
from webob.exc import WSGIHTTPException, HTTPNotFound, HTTPUnauthorized
from webob.static import FileApp
import os.path
import yaml


class ErrorCatcher(object):

    def __init__(self, trunk, error_handler_map):
        self.trunk = trunk
        self.error_handler_map = error_handler_map

    def __call__(self, req):
        req_orig = req.copy()
        try:
            return self.trunk(req)
        except WSGIHTTPException, exc:
            if exc.code in self.error_handler_map:
                handler = self.error_handler_map[exc.code]()
                return handler(req_orig)
            elif '*' in self.error_handler_map:
                handler = self.error_handler_map['*']()
                return handle(req_orig)
            else:
                raise


class PackageRouter(object):

    def __init__(self, route_map, fallback=None):
        self.route_map = route_map
        self.fallback = fallback

    def __call__(self, req):
        segment = req.path_info_peek()
        print "segment =", segment
        if segment in self.route_map:
            req.path_info_pop()
            route = self.route_map[segment]
            return route(req)
        if self.fallback is not None:
            return self.fallback(req)
        raise HTTPNotFound()


class CommandDispatcher(object):

    def __init__(self, path_handler_map, fallback=None):
        self.path_handler_map = path_handler_map
        self.fallback = fallback

    def __call__(self, req):
        path = req.path_info
        print "path =", path
        if path in self.path_handler_map:
            handler = self.path_handler_map[path]()
            return handler(req)
        if '*' in self.path_handler_map:
            handler = self.path_handler_map['*']()
            return handler(req)
        if self.fallback is not None:
            return self.fallback(req)
        raise HTTPNotFound()


class StaticServer(object):

    def __init__(self, root, file_handler_map, fallback=None):
        self.root = root
        self.file_handler_map = file_handler_map
        self.fallback = fallback

    def __call__(self, req):
        path = req.path_info
        path = os.path.normpath(path)
        if path.endswith('/'):
            path += 'index.html'
        filename = self.root+path
        print "filename =", filename
        packages = get_packages()
        if packages.exists(filename):
            for segment in path.split('/'):
                if segment.startswith('.') or segment.startswith('_'):
                    raise HTTPNotFound()
            role = 'authenticated'
            roles_filename = self.root+'/_roles.yaml'
            if packages.exists(roles_filename):
                role_map = yaml.load(packages.open(roles_filename))
                role = role_map.get(path, role)
            if not authorize(req, role):
                raise HTTPUnauthorized()
            ext = os.path.splitext(filename)[1]
            if ext in self.file_handler_map:
                handler = self.file_handler_map[ext](filename)
                return handler(req)
            else:
                file_app = FileApp(packages.abspath(filename))
                return file_app(req)
        if self.fallback is not None:
            return self.fallback(req)
        raise HTTPNotFound()


class StandardWSGI(WSGI):

    @classmethod
    def build(cls):
        mount = get_mount()
        file_handler_map = FileHandler.map_all()
        packages = get_packages()
        default = None
        route_map = {}
        for package in packages:
            route = None
            path_handler_map = PathHandler.map_package(package.name)
            if path_handler_map:
                route = CommandDispatcher(path_handler_map, route)
            if package.exists('www'):
                root = "%s:/www" % package.name
                route = StaticServer(root, file_handler_map, route)
            if route is not None:
                if mount[package.name]:
                    route_map[mount[package.name]] = route
                else:
                    default = route
        router = PackageRouter(route_map, default)
        error_handler_map = ErrorHandler.map_all()
        catcher = ErrorCatcher(router, error_handler_map)
        return cls(catcher)

    def __init__(self, handler):
        self.handler = handler

    def __call__(self, environ, start_response):
        req = Request(environ)
        req.session = session = SessionObject(environ)
        req.mount = {}
        for name, segment in get_mount().items():
            if segment:
                req.mount[name] = req.application_url+"/"+segment
            else:
                req.mount[name] = req.application_url
        try:
            resp = self.handler(req)
        except WSGIHTTPException, exc:
            resp = exc
        if session.accessed():
            session.persist()
            if session.__dict__['_headers']['set_cookie']:
                cookie = session.__dict__['_headers']['cookie_out']
                if cookie:
                    resp.headers.add('Set-Cookie', cookie)
        return resp(environ, start_response)


