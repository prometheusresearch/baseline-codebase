#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from .cache import cached
from .context import get_rex
from .error import Error
import sys
import os, os.path
import tempfile
import shutil
import atexit
import pkg_resources


class Package(object):
    """
    Component of a RexDB application.

    `name`
        The package name.
    `modules`
        Modules incuded in the package.
    `static`
        Directory containing static files of the package.
    """

    # Maps a module name to a set of packages disabled by the module.
    disable_map = {}

    @classmethod
    def disable(cls, name, module=None):
        """
        Disables the given package.

        This method prevents the package from being included with
        the application even if the package is a part of the dependency tree.

        `name`
            Name of the package to disable.
        `module`
            The module which disables the package; if not set,
            use the module of the caller.
        """
        if module is None:
            module = sys._getframe(1).f_globals['__name__']
        cls.disable_map.setdefault(module, set())
        cls.disable_map[module].add(name)

    @classmethod
    def disable_reset(cls, module=None):
        """
        Reenables all the packages disabled by the given module.
        """
        if module is None:
            module = sys._getframe(1).f_globals['__name__']
        cls.disable_map.pop(module, None)

    def __init__(self, name, modules=set(), static=None):
        self.name = name
        self.modules = modules
        self.static = static

    def abspath(self, local_path):
        """
        Takes a `local_path` relative to the static directory of the package.

        The path does not have to refer to an existing file, but should not
        escape the static directory.

        *Returns:* the normalized absolute path; ``None`` if the path is invalid
        or the package does not have a static directory.
        """
        # Do we have static files at all?
        if self.static is None:
            return None
        # Treat an absolute path as if its root is the static directory.
        if local_path.startswith('/'):
            local_path = local_path[1:]
        # Normalize the path and make sure it does not escape the static
        # directory.
        real_static = os.path.abspath(self.static)
        real_path = os.path.abspath(os.path.join(real_static, local_path))
        if not (real_path == real_static or
                real_path.startswith(real_static+'/')):
            return None
        return real_path

    def exists(self, local_path):
        """
        Returns ``True`` if the path refers to an existing file or directory.
        """
        real_path = self.abspath(local_path)
        return (real_path is not None and os.path.exists(real_path))

    def open(self, local_path):
        """
        Opens and returns the file referred by `local_path`.
        """
        real_path = self.abspath(local_path)
        assert real_path is not None, local_path
        return open(real_path)

    def walk(self, local_path):
        """
        Iterates over the directory tree with the root at `local_path`.
        """
        real_path = self.abspath(local_path)
        assert real_path is not None, local_path
        return os.walk(real_path)

    def __repr__(self):
        args = [repr(self.name)]
        if self.modules:
            args.append("modules=%r" % self.modules)
        if self.static is not None:
            args.append("static=%r" % self.static)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class PythonPackage(Package):
    """
    A package generated from a Python distribution.
    """


class ModulePackage(Package):
    """
    A package generated from a module name.
    """

    def __init__(self, name, modules):
        super(ModulePackage, self).__init__(name, modules=modules)


class StaticPackage(Package):
    """
    A package generated from a path to a directory.
    """

    def __init__(self, name, static):
        super(StaticPackage, self).__init__(name, static=static)


class SandboxPackage(Package):
    """
    A package created from the ``__main__`` module and a temporary
    static directory.  Useful for testing.
    """

    def __init__(self, name='sandbox'):
        modules = set(['__main__'])
        # Create a temporary static directory and make sure it is
        # deleted on exit.
        static = tempfile.mkdtemp()
        atexit.register(shutil.rmtree, static, True)
        super(SandboxPackage, self).__init__(name=name,
                modules=modules, static=static)

    def rewrite(self, local_path, content):
        """
        Creates or rewrites a file in the static directory.

        If `content` is ``None``, removes a file or a directory.
        """
        real_path = self.abspath(local_path)
        assert real_path is not None, local_path
        if content is not None:
            # Create. the base directory if necessary.
            directory = os.path.dirname(real_path)
            if not os.path.exists(directory):
                os.makedirs(directory)
            # Create the file.
            with open(real_path, 'w') as stream:
                stream.write(content)
        else:
            # Remove a file or a directory.
            if os.path.exists(real_path):
                if os.path.isdir(real_path):
                    shutil.rmtree(real_path)
                else:
                    os.unlink(real_path)

    def __repr__(self):
        args = []
        if self.name != 'sandbox':
            args.append(repr(self.name))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class PackageCollection(object):
    """
    Collection of packages.
    """

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
        # Filter out disabled packages.
        disabled = set()
        for module in Package.disable_map:
            if any([module in package.modules for package in packages]):
                disabled.update(Package.disable_map[module])
        packages = [
                package
                for package in packages
                if package.name not in disabled]
        return cls(packages)

    @classmethod
    def _build_package_tree(cls, key, seen):
        # Emits packages for the given requirement.

        # If `key` is already a `Package` object, we are done.
        if isinstance(key, Package):
            yield key
            return

        # Otherwise, it must be a sandbox package, a Requirement object,
        # a requirement string, a module name, or a directory.

        # Name `-` indicates a sandbox package.
        if key == '-':
            yield SandboxPackage()
            return

        # Path to a directory must end with `/`.
        if isinstance(key, str) and key.endswith('/') and os.path.isdir(key):
            name = os.path.basename(key.rstrip('/'))
            yield StaticPackage(name, static=key)
            return

        # Otherwise, it is a requirement or a module name.
        try:
            # setuptools>=20.0 refuses to parse names that start with `_`;
            # which breaks using '__main__' as a package.
            if (isinstance(key, str) and
                    (key.startswith('_') or key.endswith('_'))):
                raise pkg_resources.ResolutionError
            dist = pkg_resources.get_distribution(key)
        except ValueError:
            raise Error("Got ill-formed requirement:", key)
        except pkg_resources.ResolutionError:
            # Perhaps, it is a module name?
            if key in sys.modules:
                yield ModulePackage(key, modules=set([key]))
                return
            raise Error("Failed to satisfy requirement:", str(key))

        # Normalize the package name.
        name = dist.key
        name = name.replace('-', '_')

        # Check if this package was already processed.
        if name in seen:
            return
        seen.add(name)

        # Determine modules where we will look for extensions.
        init = None
        modules = set()
        if dist.has_metadata('rex_init.txt'):
            init = dist.get_metadata('rex_init.txt')
        if init == '-':
            return
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
            # When the package is installed from a wheel distribution,
            # `rex.static.txt` will contain a wrong path.  Try to find
            # the static directory in one of the standard locations.
            if not os.path.exists(static):
                suffix = ('share', 'rex', os.path.basename(static))
                for prefix in [
                        (sys.prefix,),
                        (sys.prefix, 'local')]:
                    standard_static = os.path.join(*prefix+suffix)
                    if os.path.exists(standard_static):
                        static = standard_static
                        break
            if not os.path.exists(static):
                raise Error("Cannot find static directory:", static)

        # Process package dependencies first.  That ensures that the packages
        # are ordered with respect to the dependency relations.
        for req in dist.requires():
            try:
                for package in cls._build_package_tree(req, seen):
                    yield package
            except Error as error:
                error.wrap("Required for:", name)
                raise

        # Skip packages without extensions or static packages, emit the rest.
        # FIXME: should include all packages which depend on ``rex.core``.
        if modules or static:
            yield PythonPackage(name, modules, static)

    def __init__(self, packages):
        self.packages = packages
        self.package_map = dict((package.name, package)
                                for package in packages)
        self.modules = dict((module, package)
                            for package in self.packages
                            for module in package.modules)

    def __iter__(self):
        """
        Iterates over the packages.
        """
        return iter(self.packages)

    def __reversed__(self):
        # Support for `reversed()` operator.
        return reversed(self.packages)

    def __len__(self):
        """
        Returns the number of packages.
        """
        return len(self.packages)

    def __getitem__(self, index_or_name):
        """
        Gets the package by index or by name.
        """
        if isinstance(index_or_name, int):
            return self.packages[index_or_name]
        else:
            return self.package_map[index_or_name]

    def __contains__(self, name):
        """
        Checks if a package with the given name exists.
        """
        return (name in self.package_map)

    def get(self, name, default=None):
        """
        Returns the package by name.
        """
        return self.package_map.get(name, default)

    def _delegate(self, package_path, method, *args, **kwds):
        # Delegates an operation with a static file to the respective package.
        assert ':' in package_path, \
                "missing package name in path: %r" % package_path
        package_name, local_path = package_path.split(':', 1)
        assert package_name in self.package_map, \
                "unknown package name in path: %r" % package_path
        package = self.package_map[package_name]
        return method(package, local_path, *args, **kwds)

    def abspath(self, package_path):
        """
        Takes a `package_path` composed of the package name and a relative path
        separated by ``:``.

        *Returns:* the normalized absolute path.
        """
        return self._delegate(package_path, Package.abspath)

    def exists(self, package_path):
        """
        Returns ``True`` if the path refers to an existing file or directory.
        """
        return self._delegate(package_path, Package.exists)

    def open(self, package_path):
        """
        Opens and returns the file referred by `package_path`.
        """
        return self._delegate(package_path, Package.open)

    def walk(self, package_path):
        """
        Iterates over the directory tree with the root at `package_path`.
        """
        return self._delegate(package_path, Package.walk)

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__, self.packages)


@cached
def get_packages():
    """
    Returns the packages included with the current active application.
    """
    return PackageCollection.build()


