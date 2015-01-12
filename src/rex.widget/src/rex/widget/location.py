"""

    rex.widget.location
    ===================

    :copyright: 2014, Prometheus Research, LLC

"""

from zope import proxy

from rex.core import Location, Error

__all__ = ('locate', 'set_location', 'strip_location', 'location_info_guard')

def locate(o):
    """ Return a location within the YAML source of ``o`` object.

    In case there's no location associated, returns ``None``.
    """
    if proxy.isProxy(o, LocationAwareProxy):
        return o.__rex_widget_location__


def set_location(o, location):
    """ Associate the ``location`` with ``o`` object.
    
    If object is already associated with location it is returned as-is.
    """
    if proxy.isProxy(o, LocationAwareProxy):
        return o
    return LocationAwareProxy(o, location)


def strip_location(o, recursive=False):
    o = proxy.getProxiedObject(o)
    if recursive:
        if isinstance(o, dict):
            o = {
                strip_location(k): strip_location(v, recursive=True)
                for k, v in o.items()
            }
        elif isinstance(o, list):
            o = [strip_location(v, recursive=True) for v in o]
    return o


class location_info_guard(object):

    def __init__(self, location):
        if not isinstance(location, Location):
            location = locate(location)
        self.location = location

    def __enter__(self):
        pass

    def __exit__(self, exc_type, exc_value, exc_traceback):
        if isinstance(exc_value, Error) and self.location:
            exc_value.wrap("While parsing:", self.location)


class LocationAwareProxy(proxy.ProxyBase):
    """ A proxy for value which holds location."""

    __slots__ = ('__rex_widget_location__',)

    def __new__(cls, o, location):
        p = proxy.ProxyBase.__new__(cls, o)
        p.__rex_widget_location__ = location
        return p

    def __init__(self, o, location):
        pass

    # Workaround zope.proxy bug which prevents int(proxy) to work
    def __int__(self):
        return int(proxy.removeAllProxies(self))

    # Workaround zope.proxy bug which prevents float(proxy) to work
    def __float__(self):
        return float(proxy.removeAllProxies(self))
