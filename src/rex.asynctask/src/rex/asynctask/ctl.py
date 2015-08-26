#
# Copyright (c) 2015, Prometheus Research, LLC
#


import os
import signal
import time

from multiprocessing import Process, Pipe

from rex.core import get_settings
from rex.ctl import RexTask
from rex.logging import get_logger

from .worker import AsyncTaskWorker


__all__ = (
    'AsyncTaskWorkerTask',
)


class AsyncTaskWorkerTask(RexTask):
    """
    Launches processes for the rex.asynctask workers that are configured.

    Starts worker processes according to the asynctask_workers setting that
    will continually watch the queues and process tasks as they come across.
    """

    # pylint: disable=attribute-defined-outside-init

    name = 'asynctask-workers'

    def __init__(self, *args, **kwargs):
        super(AsyncTaskWorkerTask, self).__init__(*args, **kwargs)
        self._workers = {}
        self._connections = {}
        self._dying = False
        self._master_pid = os.getpid()

    def __call__(self):
        with self.make():
            self.logger = get_logger(self)

            worker_config = get_settings().asynctask_workers
            if not worker_config:
                self.logger.info('No workers configured; terminating.')
                return

            for queue_name, worker_name in worker_config.items():
                self.build_worker(queue_name, worker_name)

            def on_term(signum, frame):  # pylint: disable=unused-argument
                if self._master_pid == os.getpid():
                    self._dying = True
                    self.cleanup()
            signal.signal(signal.SIGTERM, on_term)
            signal.signal(signal.SIGINT, on_term)

            check_interval = \
                get_settings().asynctask_workers_check_child_interval / 1000.0
            while not self._dying:
                try:
                    for queue_name, process in self._workers.items():
                        if not process.is_alive():
                            self.logger.error(
                                'Worker for queue %s died; restarting...' % (
                                    queue_name,
                                )
                            )
                            self.build_worker(
                                queue_name,
                                worker_config[queue_name],
                            )

                    time.sleep(check_interval)
                except KeyboardInterrupt:  # pragma: no cover
                    pass

        self.logger.info('Complete')

    def build_worker(self, queue_name, worker_name):
        worker = AsyncTaskWorker.mapped()[worker_name]()

        parent_conn, child_conn = Pipe()
        self._connections[queue_name] = parent_conn

        process = Process(target=worker, args=(child_conn, queue_name))
        self._workers[queue_name] = process

        self.logger.info(
            'Launching %s to work on queue %s',
            worker_name,
            queue_name,
        )
        process.start()

    def cleanup(self):
        self.logger.debug('Termination received; shutting down children')
        for conn in self._connections.values():
            conn.send('QUIT')
        for process in self._workers.values():
            if process.is_alive():
                process.join()
        self.logger.debug('Children dead')

