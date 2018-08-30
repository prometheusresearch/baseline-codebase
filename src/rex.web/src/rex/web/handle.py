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

    @classmethod
    def document_header(cls):
        return "%s:%s" % (cls.package().name, cls.path)

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
    def signature(cls):
        return cls.ext

    # Deprecated.
    map_all = classmethod(Extension.mapped.__func__)

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
    def signature(cls):
        return cls.code

    # Deprecated.
    map_all = classmethod(Extension.mapped.__func__)

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


