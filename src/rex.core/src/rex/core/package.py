#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .cache import cached
from .context import get_rex
import sys
import os, os.path
import pkg_resources


class Package(object):

    def __init__(self, name, modules, static):
        self.name = name
        self.modules = modules
        self.static = static

    def abspath(self, path):
        if self.static is None:
            return None
        if path.startswith('/'):
            path = path[1:]
        path = os.path.abspath(os.path.join(self.static, path))
        if not (path == self.static or path.startswith(self.static+'/')):
            return None
        return path

    def exists(self, path):
        path = self.abspath(path)
        return (path is not None and os.path.exists(path))

    def open(self, path):
        path = self.abspath(path)
        assert path is not None, path
        return open(path)

    def walk(self, path):
        path = self.abspath(path)
        assert path is not None, path
        return os.walk(path)

    def __repr__(self):
        return "%s(%r, modules=%r, static=%r)" \
                % (self.__class__.__name__,
                   self.name, self.modules, self.static)


class PackageCollection(object):

    @classmethod
    def build(cls):
        requirements = get_rex().requirements
        if not requirements:
            requirements = ['rex.core']
        packages = []
        seen = set()
        for requirement in reversed(requirements):
            packages.extend(cls._build_package_tree(requirement, seen))
        packages.reverse()
        return cls(packages)

    @classmethod
    def _build_package_tree(cls, requirement, seen):
        if isinstance(requirement, Package):
            yield requirement
            return

        dist = pkg_resources.get_distribution(requirement)
        name = dist.key
        name = name.replace('-', '_')
        if name in seen:
            return
        seen.add(name)

        for req in dist.requires():
            for package in cls._build_package_tree(req, seen):
                yield package

        init = None
        modules = set()
        if dist.has_metadata('rex_init.txt'):
            init = dist.get_metadata('rex_init.txt')
        if init is not None:
            __import__(init)
            modules = set(module for module in sys.modules
                                 if sys.modules[module] and
                                    (module == init or
                                        module.startswith(init+'.')))

        static = None
        if dist.has_metadata('rex_static.txt'):
            static = dist.get_metadata('rex_static.txt')
            static = os.path.abspath(static)
            if not os.path.exists(static):
                raise Error("Cannot find static directory:", static)

        if modules or static:
            yield Package(name, modules, static)

    def __init__(self, packages):
        self.packages = packages
        self.package_map = dict((package.name, package)
                                  for package in packages)

    @property
    @cached
    def modules(self):
        return set(module for package in self.packages
                          for module in package.modules)

    def __iter__(self):
        return iter(self.packages)

    def __getitem__(self, name):
        return self.package_map[name]

    def __reversed__(self):
        return reversed(self.packages)

    def get(self, name, default=None):
        return self.package_map.get(name, default)

    def _delegate(self, path, method, *args, **kwds):
        assert ':' in path, "ill-formed path: %r" % path
        name, local_path = path.split(':')
        assert name in self.package_map, "unknown package in path: %r" % path
        package = self.package_map[name]
        return method(package, local_path, *args, **kwds)

    def abspath(self, path):
        return self._delegate(path, Package.abspath)

    def exists(self, path):
        return self._delegate(path, Package.exists)

    def open(self, path):
        return self._delegate(path, Package.open)

    def walk(self, path):
        return self._delegate(path, Package.walk)

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__, self.packages)


@cached
def get_packages():
    return PackageCollection.build()


