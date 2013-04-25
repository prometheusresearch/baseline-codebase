#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Extension, WSGI, get_packages
from webob import Request, Response
from webob.exc import HTTPException, HTTPNotFound
from webob.static import FileApp
import os.path


class PackageHandler(Extension):

    def __call__(self, req):
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)



class Command(Extension):

    name = None

    @classmethod
    def enabled(cls):
        return (cls.name is not None)

    def __call__(self, req):
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)


class Router(object):

    def __init__(self, route_map, fallback=None):
        self.route_map = route_map
        self.fallback = fallback

    def __call__(self, req):
        segment = req.path_info_peek()
        if segment in self.route_map:
            req.path_info_pop()
            handler = self.route_map[segment]
            return handler(req)
        if self.fallback is not None:
            return self.fallback(req)
        raise HTTPNotFound()


class CommandHandler(object):

    def __init__(self, cmd_types, fallback=None):
        self.cmd_types = cmd_types
        self.cmd_type_map = dict((cmd_type.name, cmd_type)
                                 for cmd_type in cmd_types)
        self.fallback = fallback

    def __call__(self, req):
        name = req.path_info
        if name.startswith('/'):
            name = name[1:]
            if name in self.cmd_type_map:
                cmd_type = self.cmd_type_map[name]
                cmd_handler = cmd_type()
                return cmd_handler(req)
        if self.fallback is not None:
            return self.fallback(req)
        raise HTTPNotFound()


class StaticHandler(object):

    def __init__(self, directory, ext_types, fallback=None):
        self.directory = directory
        self.ext_types = ext_types
        self.ext_type_map = dict((ext_type.name, ext_type)
                                 for ext_type in ext_types)
        self.fallback = fallback

    def __call__(self, req):
        path = req.path_info
        if path.startswith('/'):
            path = os.path.normpath(path)
            path = path[1:]
            path = os.path.join(self.directory, path)
            if os.path.isdir(path):
                path = os.path.join(path, 'index.html')
            if os.path.isfile(path):
                ext = os.path.splitext(path)[1]
                if ext in self.ext_types:
                    ext_type = self.ext_types[ext]
                    ext_handler = ext_type(path)
                    return ext_handler(req)
                else:
                    handler = FileApp(path)
                    return handler(req)
        if self.fallback is not None:
            return self.fallback(req)
        raise HTTPNotFound()


class StandardWSGI(WSGI):

    @classmethod
    def build(cls):
        packages = get_packages()
        root = None
        routes = {}
        for package in packages:
            handler = None
            handler_types = PackageHandler.by_package(package.name)
            assert len(handler_types) <= 1
            if handler_types:
                handler_type = handler_types[0]
                handler = handler_type()
            if package.exists('www'):
                directory = package.abspath('www')
                handler = StaticHandler(directory, {}, fallback=handler)
            cmd_types = Command.by_package(package.name)
            if cmd_types:
                handler = CommandHandler(cmd_types, fallback=handler)
            if handler is not None:
                if root is None:
                    root = handler
                else:
                    routes[package.name] = handler
        router = Router(routes, fallback=root)
        return cls(router)

    def __init__(self, handler):
        self.handler = handler

    def __call__(self, environ, start_response):
        req = Request(environ)
        try:
            resp = self.handler(req)
        except HTTPException, exc:
            resp = exc
        return resp(environ, start_response)


