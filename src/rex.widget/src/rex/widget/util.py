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
