"""

    rex.widget.context
    ==================

    Context implementation for Rex Widget.

    :copyright: 2014, Prometheus Research, LLC

"""

from abc import ABCMeta, abstractmethod
from contextlib import contextmanager

__all__ = ('get_context', 'activated_context', 'Context')


_context = None


def get_context():
    """ Get current context instance."""
    global _context
    if _context is None:
        raise RuntimeError('no Rex Widget context is initialized')
    return _context


@contextmanager
def activated_context(context):
    global _context
    _context = context
    yield
    _context = None


class Context(object):
    """ Base class for Rex Widget context."""

    __metaclass__ = ABCMeta

    @abstractmethod
    def generate_widget_id(self, widget_class):
        pass
