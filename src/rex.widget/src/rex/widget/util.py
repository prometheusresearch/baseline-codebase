"""

    rex.widget.state.util
    =====================

    :copyright: 2014, Prometheus Research, LLC

"""

import time
import contextlib
from .logging import getLogger


log = getLogger(__name__)


@contextlib.contextmanager
def measure_execution_time(message='execution time: %f seconds', log=log):
    """ Measure and log execution time.

    Example::

        with measure_execution_time():
            potentially_expensive_computation()


    :keyword message: Optional message template
    :keyword log: Optional logger
    """
    start = time.clock()
    yield
    end = time.clock()
    log.debug(message, end - start)


class cached_property(object):
    """ Like @propety decorator but evaluates only once."""

    def __init__(self, func, name=None, doc=None):
        self.__name__ = name or func.__name__
        self.__module__ = func.__module__
        self.__doc__ = doc or func.__doc__
        self.func = func

    def __get__(self, obj, type=None):
        if obj is None:
            return self
        value = obj.__dict__.get(self.__name__, NotImplemented)
        if value is NotImplemented:
            value = self.func(obj)
            obj.__dict__[self.__name__] = value
        return value
