"""

    rex.widget.port_support
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from contextlib import contextmanager

from werkzeug.local import LocalStack
from rex.port import Port

__all__ = ('PortSupport',)

_stack = LocalStack()
_default_parameters = {}


def get_parameters():
    parameters = _stack.top
    return parameters if parameters is not None else _default_parameters


@contextmanager
def set_parameters(parameters):
    try:
        _stack.push(parameters)
        yield
    finally:
        _stack.pop()


class PortSupport(object):

    def __init__(self):
        super(PortSupport, self).__init__()
        self.port_parameters = get_parameters()

    @staticmethod
    def parameters(*args, **kwargs):
        parameters = {}
        for arg in args:
            parameters.update(arg)
        parameters.update(kwargs)
        return set_parameters(parameters)

    def create_port(self, port):
        parameters = [{'parameter': parameter, 'default': default}
                      for parameter, default
                      in list(self.port_parameters.items())]
        return Port(parameters + [port])
