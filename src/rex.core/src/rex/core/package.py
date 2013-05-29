#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .cache import cached
from .context import get_rex
from .error import Error
import sys
import os, os.path
import pkg_resources


class Package(object):
    """Component of a Rex application."""

    def __init__(self, name, modules=set(), static=None):
        self.name = name
        self.modules = modules
        self.static = static

    def abspath(self, path):
        """Returns the real path for a file in the package static directory."""
        if self.static is None:
            return None
        if path.startswith('/'):
            path = path[1:]
        real_static = os.path.abspath(self.static)
        real_path = os.path.abspath(os.path.join(real_static, path))
        if not (real_path == real_static or
                real_path.startswith(real_static+'/')):
            return None
        return real_path

    def exists(self, path):
        """Checks if the file exists."""
        real_path = self.abspath(path)
        return (real_path is not None and os.path.exists(real_path))

    def open(self, path):
        """Opens a file in the static directory of the package."""
        real_path = self.abspath(path)
        assert real_path is not None, path
        return open(real_path)

    def walk(self, path):
        """Iterates over a directory tree in the static directory."""
        real_path = self.abspath(path)
        assert real_path is not None, path
        return os.walk(real_path)

    def __repr__(self):
        return "%s(%r, modules=%r, static=%r)" \
                % (self.__class__.__name__,
                   self.name, self.modules, self.static)


class PackageCollection(object):
    """Collection of all packages."""

    @classmethod
    def build(cls):
        # Builds package collection from a list of requirements.
        requirements = list(get_rex().requirements)
        requirements.append('rex.core')
        packages = []
        seen = set()
        for requirement in reversed(requirements):
            packages.extend(cls._build_package_tree(requirement, seen))
        packages.reverse()
        return cls(packages)

    @classmethod
    def _build_package_tree(cls, key, seen):
        # Emits packages for the given requirement.

        # If `key` is already a `Package` object, we are done.
        if isinstance(key, Package):
            yield key
            return

        # Otherwise, it must be a Requirement object, a requirement string,
        # a module name, or a directory.

        # Path to a directory must end with `/`.
        if isinstance(key, str) and key.endswith('/') and os.path.isdir(key):
            name = os.path.basename(key.rstrip('/'))
            yield Package(name, static=key)
            return

        # Otherwise, it is a requirement or a module name.
        try:
            dist = pkg_resources.get_distribution(key)
        except ValueError:
            raise Error("Got ill-formed requirement:", key)
        except pkg_resources.ResolutionError:
            # Perhaps, it is a module name?
            if key in sys.modules:
                yield Package(key, modules=set([key]))
                return
            raise Error("Failed to satisfy requirement:", str(key))

        # Normalize the package name.
        name = dist.key
        name = name.replace('-', '_')

        # Check if this package was already processed.
        if name in seen:
            return
        seen.add(name)

        # Process package dependencies first.  That ensures that the packages
        # are ordered with respect to the dependency relations.
        for req in dist.requires():
            for package in cls._build_package_tree(req, seen):
                yield package

        # Determine modules where we will look for extensions.
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

        # Determine the directory with static files.
        static = None
        if dist.has_metadata('rex_static.txt'):
            static = dist.get_metadata('rex_static.txt')
            static = os.path.abspath(static)
            if not os.path.exists(static):
                raise Error("Cannot find static directory:", static)

        # Skip packages without extensions or static packages, emit the rest.
        if modules or static:
            yield Package(name, modules, static)

    def __init__(self, packages):
        self.packages = packages
        self.package_map = dict((package.name, package)
                                  for package in packages)
        self.modules = set(module for package in self.packages
                                  for module in package.modules)

    def __iter__(self):
        """Iterate over packages."""
        return iter(self.packages)

    def __reversed__(self):
        return reversed(self.packages)

    def __len__(self):
        return len(self.packages)

    def __getitem__(self, name):
        """Get the package by index or by name."""
        if isinstance(name, int):
            return self.packages[name]
        else:
            return self.package_map[name]

    def get(self, name, default=None):
        """Get the package by name."""
        return self.package_map.get(name, default)

    def _delegate(self, path, method, *args, **kwds):
        # Delegate operations with static files to individual packages.
        assert ':' in path, "missing package name in path: %r" % path
        name, local_path = path.split(':')
        assert name in self.package_map, \
                "unknown package name in path: %r" % path
        package = self.package_map[name]
        return method(package, local_path, *args, **kwds)

    def abspath(self, path):
        """Returns a real path to the static file."""
        return self._delegate(path, Package.abspath)

    def exists(self, path):
        """Checks if the static file exists."""
        return self._delegate(path, Package.exists)

    def open(self, path):
        """Opens a static file."""
        return self._delegate(path, Package.open)

    def walk(self, path):
        """Iterates over a directory tree."""
        return self._delegate(path, Package.walk)

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__, self.packages)


@cached
def get_packages():
    """Returns a collection of packages for the active application.""" 
    return PackageCollection.build()


