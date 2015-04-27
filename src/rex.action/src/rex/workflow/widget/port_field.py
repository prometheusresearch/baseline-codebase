"""

    rex.w.port_field
    ================

    :copyright: 2015, Prometheus Research, LLC

"""

import hashlib
import collections

from rex.core import Validate
from rex.port import Port, GrowVal
from rex.urlmap import PortRenderer
from rex.web import get_routes
from rex.widget.modern import Field


__all__ = ('PortDesc', 'PortDescVal', 'PortField', 'register_port')


PortDesc = collections.namedtuple('PortDesc', ['port', 'entity'])


class PortDescVal(Validate):

    _validate = GrowVal()

    def __call__(self, value):
        if isinstance(value, PortDesc):
            return value
        value = self._validate(value)
        port = Port(value)
        return PortDesc(port=port, entity=port.tree.keys()[0])


class PortField(Field):

    def __init__(self):
        super(PortField, self).__init__(PortDescVal())

    def apply(self, widget, port_desc):
        path = register_port(widget.package, port_desc.port)
        props = {
            self.name: {
                'path': path,
                'entity': port_desc.entity
            }
        }
        return props, []


def register_port(package, port):
    assert package is not None
    path = '/autodata/%s' % hashlib.md5(str(port)).hexdigest()
    routes = get_routes(package)
    if not path in routes:
        routes.add(path, PortRenderer(port, None, None))
    return path



