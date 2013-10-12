#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .cache import cached
from .package import get_packages, Package


class Extension(object):
    """
    Provides extension mechanism for RexDB applications.

    To create a new extensible interface, declare a subclass of
    :class:`Extension`.

    To create an implementation of the interface, declare a subclass of the
    interface class.

    Use methods :meth:`all()`, :meth:`by_package()`, :meth:`top()` to find
    implementations for the given interface.
    """

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
        """
        This method is called when a new interface or implementation class is
        created.  Specific interfaces may override this method to check that
        implementations satisfy the constraints imposed by the interface.
        """

    @classmethod
    def enabled(cls):
        """
        Returns ``True`` for complete implementations; ``False`` for abstract
        and mixin classes.  Specific interfaces and implementations may
        override this method.
        """
        return (cls is not Extension)

    @classmethod
    @cached
    def all(cls):
        """
        Returns a list of all implementations for the given interface.
        """
        packages = get_packages()
        modules = packages.modules
        # Find all subclasses of `cls`.
        subclasses = [cls]
        # Used to weed out duplicates (due to diamond inheritance).
        seen = set([cls])
        idx = 0
        while idx < len(subclasses):
            for subclass in subclasses[idx].__subclasses__():
                if subclass not in seen:
                    subclasses.append(subclass)
                    seen.add(subclass)
            idx += 1
        # Filter out abstract classes and implementations not included
        # with the active application; return the rest.
        return [subclass for subclass in subclasses
                         if subclass.__module__ in modules and
                            subclass.enabled()]

    @classmethod
    @cached
    def top(cls):
        """
        Returns the most specific implementation for the given interface.

        The most specific implementation must be a subclass of all the other
        implementations of the same interface.
        """
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
        """
        Returns implementations defined in the given package.

        `package`
            Package name or :class:`Package` object.
        """
        if not isinstance(package, Package):
            package = get_packages()[package]
        return [extension for extension in cls.all()
                          if extension.__module__ in package.modules]


