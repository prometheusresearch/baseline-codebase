#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .cache import cached
from .package import get_packages, Package


class Extension(object):
    """Provides extension mechanism for Rex applications."""

    class __metaclass__(type):

        def __new__(mcls, name, bases, members):
            # Call `sanitize()` when a new implementation is defined.
            cls = type.__new__(mcls, name, bases, members)
            cls.sanitize()
            return cls

        def __repr__(cls):
            return "%s.%s" % (cls.__module__, cls.__name__)

    @classmethod
    def sanitize(cls):
        """Validates a new implementation."""

    @classmethod
    def enabled(cls):
        """Checks if the implementation is enabled."""
        return True

    @classmethod
    @cached
    def all(cls):
        """Returns all implementations for the given interface."""
        packages = get_packages()
        modules = packages.modules
        # Find all subclasses of `cls`.
        subclasses = [cls]
        idx = 0
        while idx < len(subclasses):
            subclass = subclasses[idx]
            subclasses.extend(subclass.__subclasses__())
            idx += 1
        return [subclass for subclass in subclasses
                         if subclass.__module__ in modules and
                            subclass.enabled()]

    @classmethod
    @cached
    def top(cls):
        """Returns the most specific implementation for the given interface."""
        extensions = cls.all()
        # Find all the leaves in the inheritance tree.
        candidates = []
        for extension in extensions:
            if not any(issubclass(candidate, extension)
                       for candidate in candidates):
                candidates = [candidate for candidate in candidates
                                        if not issubclass(extension, candidate)]
                candidates.append(extension)
        # Ensure there is only one leaf and return it.
        assert len(candidates) >= 1, "no implementations found"
        assert len(candidates) <= 1, "too many implementations found: %s" \
                % ", ".join(repr(candidate) for candidate in candidates)
        return candidates[0]

    @classmethod
    @cached
    def by_package(cls, package):
        """Returns implementations defined in the given package."""
        if not isinstance(package, Package):
            package = get_packages()[package]
        return [extension for extension in cls.all()
                          if extension.__module__ in package.modules]


