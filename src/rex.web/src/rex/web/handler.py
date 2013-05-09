#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Extension, cached


class PathHandler(Extension):

    path = None

    @classmethod
    @cached
    def map_package(cls, name):
        mapping = {}
        for extension in cls.by_package(name):
            assert extension.path not in mapping, \
                    "duplicate path handler: %r" % extension.path
            mapping[extension.path] = extension
        return mapping

    @classmethod
    def enabled(cls):
        return (cls.path is not None)

    def __call__(self, req):
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)


class FileHandler(Extension):

    ext = None

    @classmethod
    @cached
    def map_all(cls):
        mapping = {}
        for extension in cls.all():
            assert extension.ext not in mapping, \
                    "duplicate file handler: %r" % extension.ext
            mapping[extension.ext] = extension
        return mapping

    @classmethod
    def enabled(cls):
        return (cls.ext is not None)

    def __init__(self, filename):
        self.filename = filename

    def __call__(self, req):
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)


class ErrorHandler(Extension):

    code = None

    @classmethod
    @cached
    def map_all(cls):
        mapping = {}
        for extension in cls.all():
            assert extension.code not in mapping, \
                    "duplicate error handler: %r" % extension.code
            mapping[extension.code] = extension
        return mapping

    @classmethod
    def enabled(cls):
        return (cls.code is not None)

    def __init__(self, error):
        self.error = error

    def __call__(self, req):
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)


