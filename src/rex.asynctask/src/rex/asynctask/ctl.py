#
# Copyright (c) 2015, Prometheus Research, LLC
#


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

    name = 'asynctask-workers'

    def __init__(self, *args, **kwargs):
        super(AsyncTaskWorkerTask, self).__init__(*args, **kwargs)
        self._workers = []
        self._connections = []
        self._dying = False

    def __call__(self):
        with self.make():
            self.logger = get_logger(self)

            worker_config = get_settings().asynctask_workers
            if not worker_config:
                self.logger.info('No workers configured; terminating.')
                return

            for queue_name, worker_name in worker_config.items():
                worker = AsyncTaskWorker.mapped()[worker_name]()

                parent_conn, child_conn = Pipe()
                self._connections.append(parent_conn)

                process = Process(target=worker, args=(child_conn, queue_name))
                self._workers.append(process)

                self.logger.info(
                    'Launching %s to work on queue %s',
                    worker_name,
                    queue_name,
                )
                process.start()

        def on_term(signum, frame):  # pylint: disable=unused-argument
            self._dying = True
            self.cleanup()
        signal.signal(signal.SIGTERM, on_term)
        signal.signal(signal.SIGINT, on_term)

        while not self._dying:
            try:
                # TODO check to see if kids are still alive, if not, restart
                time.sleep(250)
            except KeyboardInterrupt:  # pylint: disable=pointless-except
                pass

        self.logger.info('Complete')

    def cleanup(self):
        self.logger.debug('Termination received; shutting down children')
        for conn in self._connections:
            conn.send('QUIT')
        for worker in self._workers:
            if worker.is_alive():
                worker.join()

