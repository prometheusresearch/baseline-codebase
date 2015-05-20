"""

    rex.widget.pointer
    ==================

    :copyright: 2015, Prometheus Research, LLC

"""

from .keypath import KeyPathVal
from .url import URL

__all__ = ('Pointer',)


class Pointer(object):
    """ Value which generates an URL to point to a specific location within the
    widget hierarchy.
    """

    def __init__(self, widget, path=(), url_type=URL, wrap=None):
        self.widget = widget
        self.path = path
        self.url_type = url_type
        self.wrap = wrap

    def __repr__(self):
        return '<%s to %s of %s>' % (
            self.__class__.__name__,
            self.url_type.__name__,
            self.widget.__class__.__name__)

    __str__ = __repr__
    __unicode__ = __repr__

    def __call__(self, req, path=()):
        path = KeyPathVal.to_string(path[:-1] + self.path)
        url = self.url_type(req.path_url, params={'__to__': path})
        if self.wrap:
            return self.wrap(self.widget, url)
        else:
            return url
