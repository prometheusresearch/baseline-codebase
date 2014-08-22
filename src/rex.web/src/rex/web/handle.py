#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import Extension, cached
from .path import PathMask, PathMap


class HandleLocation(Extension):
    """
    Interface for handling custom URLs.

    Location handlers are local to the package where they are defined.

    See also :class:`rex.web.Command`.
    """

    #: URL fragment (e.g. ``'/login'`` or ``'*'`` for catch-all)
    path = None

    @classmethod
    def sanitize(cls):
        if 'path' in cls.__dict__ and cls.path is not None:
            if not isinstance(cls.path, PathMask):
                cls.path = PathMask(cls.path)

    @classmethod
    def enabled(cls):
        return (cls.path is not None)

    def __call__(self, req):
        """
        Handles the request.

        Implementations must override this method.
        """
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)


class HandleFile(Extension):
    """
    Interface for rendering static resources.

    `path`
        Path to the resource in format ``'<package>:<local_path>'``.
    """

    #: File extension (e.g. ``'.html'``)
    ext = None

    @classmethod
    @cached
    def map_all(cls):
        """
        Returns a dictionary mapping file extensions to handler types.
        """
        mapping = {}
        for extension in cls.all():
            assert extension.ext not in mapping, \
                    "duplicate file handler: %r" % extension.ext
            mapping[extension.ext] = extension
        return mapping

    @classmethod
    def enabled(cls):
        return (cls.ext is not None)

    def __init__(self, path):
        self.path = path

    def __call__(self, req):
        """
        Handles the request.

        Implementations must override this method.
        """
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)


class HandleError(Extension):
    """
    Interface for custom error handlers.

    This interface is used to process HTTP exceptions occurred within
    :mod:`rex.web` pipeline.
    """

    #: HTTP error code (e.g. ``404`` or ``'*'`` for catch-all).
    code = None

    @classmethod
    @cached
    def map_all(cls):
        """
        Returns a dictionary mapping error codes to handler types.

        `error`
            The original HTTP exception.
        """
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
        """
        Handles the request.

        Implementations must override this method.
        """
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)


