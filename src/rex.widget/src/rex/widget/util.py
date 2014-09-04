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
    start = time.clock()
    yield
    end = time.clock()
    log.debug(message, end - start)
