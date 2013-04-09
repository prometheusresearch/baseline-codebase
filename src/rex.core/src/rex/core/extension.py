#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .cache import cached
from .context import active_app


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
        packages = active_app.packages
        modules = packages.modules
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
    def one(cls):
        extensions = cls.all()
        assert len(extensions) >= 1, \
                "found no implementations of %s" % cls.__class__.__name__
        assert len(extensions) <= 1, \
                "found too many implementations of %s" % cls.__class__.__name__
        return extensions[0]

    @classmethod
    @cached
    def by_package(cls, name):
        package = app.packages[name]
        return [extension for extension in self.all()
                          if extension.__module__ in package.modules]


