#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .cache import cached
from .package import get_packages


class Extension(object):

    class __metaclass__(type):

        def __new__(mcls, name, bases, members):
            cls = type.__new__(mcls, name, bases, members)
            cls.sanitize()
            return cls

    @classmethod
    def sanitize(cls):
        """Validates a new extension."""

    @classmethod
    def enabled(cls):
        return True

    @classmethod
    @cached
    def all(cls):
        packages = get_packages()
        modules = packages.modules
        subclasses = [cls]
        idx = 0
        while idx < len(subclasses):
            subclass = subclasses[idx]
            subclasses.extend(subclass.__subclasses__())
            idx += 1
        subclasses.reverse()
        return [subclass for subclass in subclasses
                         if subclass.__module__ in modules and
                            subclass.enabled()]

    @classmethod
    @cached
    def by_package(cls, name):
        packages = get_packages()
        package = packages[name]
        return [extension for extension in cls.all()
                          if extension.__module__ in package.modules]


