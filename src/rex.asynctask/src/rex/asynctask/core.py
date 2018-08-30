#
# Copyright (c) 2015, Prometheus Research, LLC
#


from urllib.parse import urlparse

from rex.core import cached, get_settings, Error
from rex.logging import disable_logging, enable_logging

from .transports import AsyncTransport


__all__ = (
    'get_transport',
    'process_queue',
    'run_worker',
)


@cached
def get_transport(uri=None):
    """
    Retrieves a connection to the transport that controls the queuing and
    dequeuing of tasks.

    :param uri:
        the transport URI to retrieve the connection to; if not specified,
        defaults to the value of the ``asynctask_transport`` setting
    :type uri: str
    :rtype: AsyncTransport
    """

    uri = uri or get_settings().asynctask_transport
    if not uri:
        if hasattr(get_settings(), 'db'):
            uri = str(get_settings().db['htsql']['db'])
        else:
            raise Error('Asynctask transport not specified')

    parts = urlparse(uri)
    transport = AsyncTransport.mapped().get(parts.scheme)
    if not transport:
        raise ValueError(
            '"%s" does not resolve to a known AsyncTransport' % (
                uri,
            )
        )

    return transport(parts)


def process_queue(queue_name, worker_name=None, quiet=False):
    """
    Process all the tasks in the specified queue.

    :param queue_name: the name of the queue to process
    :type queue_name: str
    :param worker_name:
        the name of the AsyncTaskWorker to use to process the queue. If not
        specified, defaults to the worker configured in the
        ``asynctask_workers`` application setting.
    :type worker_name: str
    :param quiet:
        whether or not worker logging output should be disabled. If not
        specified, defaults to False.
    :type quiet: bool
    :returns: the number of tasks that were processed
    """

    if worker_name is None:
        for cfg_queue, cfg_worker in list(get_settings().asynctask_workers.items()):
            if queue_name == cfg_queue and cfg_worker:
                worker_name = cfg_worker.worker
                break
        else:
            raise Error(
                'Cannot identify worker for queue "%s"' % (queue_name,)
            )

    return _process(queue_name, worker_name, quiet)


def run_worker(worker_name, queue_name=None, quiet=False):
    """
    Execute a worker until it has no more tasks.

    :param worker_name: the name of the worker to run
    :type worker_name: str
    :param queue_name:
        the name of the queue to retrieve tasks from. If not specified,
        defaults to the queue configured in the ``asynctask_workers``
        application setting.
    :param quiet:
        whether or not worker logging output should be disabled. If not
        specified, defaults to False.
    :type quiet: bool
    :returns: the number of tasks that were processed
    """

    if queue_name is None:
        for cfg_queue, cfg_worker in list(get_settings().asynctask_workers.items()):
            if cfg_worker and worker_name == cfg_worker.worker:
                queue_name = cfg_queue
                break
        else:
            raise Error(
                'Cannot identify queue for worker "%s"' % (worker_name,)
            )

    return _process(queue_name, worker_name, quiet)


def _process(queue_name, worker_name, quiet):
    if quiet:
        disable_logging()

    transport = get_transport()
    from .worker import AsyncTaskWorker
    worker = AsyncTaskWorker.mapped().get(worker_name, None)
    if not worker:
        raise Error('Worker "%s" does not exist' % (worker_name,))
    worker = worker()

    num_processed = 0
    task = transport.get_task(queue_name)
    while task is not None:
        worker.process(task)
        num_processed += 1
        task = transport.get_task(queue_name)

    if quiet:
        enable_logging()

    return num_processed

