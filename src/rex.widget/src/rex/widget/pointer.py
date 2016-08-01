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

    def __init__(self, widget, url_type=URL, wrap=None, to_field=False):
        self.widget = widget
        self.url_type = url_type
        self.wrap = wrap
        self.to_field = to_field

    def __repr__(self):
        return '<%s to %s of %s>' % (
            self.__class__.__name__,
            self.url_type.__name__,
            self.widget.__class__.__name__)

    __str__ = __repr__
    __unicode__ = __repr__

    def __transit_format__(self, req, path):
        if not self.to_field:
            path = path[:-2]
        path = KeyPathVal.to_string(path)
        if '/@@/' in req.path_info:
            origin = req.path_info[:req.path_info.find('/@@/') + 1]
        else:
            origin = req.path_info
        if origin.endswith('/'):
            origin = origin[:-1]
        path = '%s%s/@@/%s' % (req.application_url, origin, path)
        url = self.url_type(path)
        if self.wrap:
            return self.wrap(self.widget, url)
        else:
            return url
