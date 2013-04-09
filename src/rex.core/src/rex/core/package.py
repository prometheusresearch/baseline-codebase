#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .cache import cached
from .context import active_app
import sys
import os, os.path
import pkg_resources


class Package(object):

    def __init__(self, name, static, prefix, modules):
        self.name = name
        self.static = static
        self.prefix = prefix
        self.modules = modules

    def abspath(self, path):
        if self.static is None:
            return None
        path = os.path.abspath(os.path.join(self.static, path))
        if not (path == self.static or path.startswith(self.static+'/')):
            return None
        return path

    def exists(self, path):
        return (self.abspath(path) is not None)

    def open(self, path):
        path = self.abspath(path)
        assert path is not None, path
        return open(path)

    def walk(self, path):
        path = self.abspath(path)
        assert path is not None, path
        return os.walk(path)


class PackageCollection(object):

    @classmethod
    def build(cls, requirements):
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
        dist = pkg_resources.get_distribution(requirement)
        name = dist.key
        if name in seen:
            return
        seen.add(name)

        for req in dist.requires():
            for package in cls._build_package_tree(req, seen):
                yield package

        static = None
        if dist.has_metadata('rex_static'):
            static = dist.get_metadata('rex_static')
            static = os.path.abspath(static)
            if not os.path.exists(static):
                raise Error("Cannot find static directory:", static)

        prefix = None
        if dist.has_metadata('rex_prefix'):
            prefix = dist.get_metadata('rex_prefix')

        init = None
        modules = set()
        if dist.has_metadata('rex_init'):
            init = dist.get_metadata('rex_init')
        if init is not None:
            __import__(init)
            modules = set(module for module in sys.modules
                                 if module == init or
                                 module.startswith(init+'.'))

        yield Package(name, static, prefix, modules)

    def __init__(self, packages):
        self.packages = packages
        self.package_map = dict((package.name, package)
                                  for package in packages)

    @property
    @cached
    def modules(self):
        return set(module for package in self.packages
                          for module in package.modules)

    def root(self):
        return self.packages[0]

    def __iter__(self):
        return iter(self.packages)

    def __getitem__(self, name):
        return self.package_map[name]

    def __reversed__(self):
        return reversed(self.packages)

    def get(self, name, default=None):
        return self.package_map.get(name, default)


