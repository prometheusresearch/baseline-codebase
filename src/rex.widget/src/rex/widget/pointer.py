"""

    rex.widget.pointer
    ==================

    :copyright: 2015, Prometheus Research, LLC

"""

from .keypath import KeyPathVal
from .url import URL
from .transitionable import Transitionable

__all__ = ('Pointer',)


class Pointer(Transitionable):
    """ Value which generates an URL to point to a specific location within the
    widget hierarchy.
    """

    __transit_tag__ = '---' 

    def __init__(self, widget, path=None, url_type=URL, wrap=None):
        self.widget = widget
        self.path = path or []
        self.url_type = url_type
        self.wrap = wrap

    def __repr__(self):
        return '<%s to %s of %s>' % (
            self.__class__.__name__,
            self.url_type.__name__,
            self.widget.__class__.__name__)

    __str__ = __repr__
    __unicode__ = __repr__

    def __transit_format__(self, req, path=()):
        path = path[:-2]
        if self.path:
            path.append(1)
            path = path + self.path
        path = KeyPathVal.to_string(path)
        url = self.url_type(req.path_url, params={'__to__': path})
        if self.wrap:
            return self.wrap(self.widget, url)
        else:
            return url
