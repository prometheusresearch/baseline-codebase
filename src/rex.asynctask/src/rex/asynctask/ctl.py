#
# Copyright (c) 2015, Prometheus Research, LLC
#


import os
import signal
import time

from functools import partial
from hashlib import sha256
from multiprocessing import Process, Pipe

from apscheduler.schedulers.background import BackgroundScheduler

from rex.core import get_settings, get_rex
from rex.ctl import RexTask, option
from rex.logging import get_logger

from .core import get_transport
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

    class options(object):  # noqa
        scheduler = option(
            None,
            bool,
            hint='if specified, this process will act as the initiator for'
            ' any ScheduledAsyncTaskWorkers that are configured. This should'
            ' only be enabled for one process in cluster of workers.'
        )

    def __init__(self, *args, **kwargs):
        super(AsyncTaskWorkerTask, self).__init__(*args, **kwargs)
        self._workers = {}
        self._connections = {}
        self._dying = False
        self._master_pid = os.getpid()
        self._scheduler = None

    def __call__(self):
        with self.make():
            self.logger = get_logger(self)

            worker_config = get_settings().asynctask_workers
            scheduled_worker_config = \
                get_settings().asynctask_scheduled_workers
            if not worker_config and not scheduled_worker_config:
                self.logger.info('No workers configured; terminating.')
                return
            self.initialize_workers(worker_config, scheduled_worker_config)

            if self.scheduler:
                self._scheduler = self.build_scheduler()

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
                                'Worker for queue %s died; restarting...',
                                queue_name,
                            )
                            self.build_worker(
                                queue_name,
                                worker_config[queue_name],
                            )

                    time.sleep(check_interval)
                except KeyboardInterrupt:  # pragma: no cover
                    pass

        self.logger.info('Complete')

    def initialize_workers(self, worker_config, scheduled_worker_config):
        for queue_name, worker_name in worker_config.items():
            self.build_worker(queue_name, worker_name)

        for schedule in scheduled_worker_config:
            self.build_worker(
                self.get_scheduled_queue_name(schedule),
                schedule.worker or 'ctl_executor',
            )

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

    def build_scheduler(self):
        schedules = get_settings().asynctask_scheduled_workers
        if not schedules:
            self.logger.info(
                'No schedules configured -- not starting scheduler'
            )
            return

        scheduler = BackgroundScheduler()
        rex = get_rex()

        for schedule in schedules:
            sched = self.make_schedule(schedule)
            if schedule.worker:
                worker = schedule.worker
                payload = {}
            else:
                worker = 'ctl_executor'
                payload = {'command': schedule.ctl}

            scheduler.add_job(
                partial(self.enqueue_scheduled_task, rex, schedule),
                trigger='cron',
                args=[worker, payload],
                **sched
            )
            self.logger.info(
                'Scheduled "%s" for %r',
                schedule.worker or schedule.ctl,
                sched,
            )

        scheduler.start()
        return scheduler

    def enqueue_scheduled_task(self, rex, schedule, worker_name, payload):
        with rex:
            self.logger.debug(
                'Triggering scheduled execution of %s',
                worker_name,
            )
            get_transport().submit_task(
                self.get_scheduled_queue_name(schedule),
                payload,
            )

    def get_scheduled_queue_name(self, schedule):
        # pylint: disable=no-self-use

        name = schedule.worker
        if not name:
            hasher = sha256()
            hasher.update(repr(schedule))
            name = 'ctl_%s' % (hasher.hexdigest()[:8],)

        return 'scheduled_0_%s' % (name,)

    def make_schedule(self, schedule):
        # pylint: disable=no-self-use
        sched = {}

        for field in (
                'year', 'month', 'day',
                'week', 'day_of_week',
                'hour', 'minute', 'second'):
            val = getattr(schedule, field, None)
            if val is not None:
                sched[field] = val

        return sched

    def cleanup(self):
        if self._scheduler:
            self.logger.debug('Termination received; shutting down scheduler')
            self._scheduler.shutdown()
            self.logger.debug('Scheduler dead')

        self.logger.debug('Termination received; shutting down children')
        for conn in self._connections.values():
            conn.send('QUIT')
        for process in self._workers.values():
            if process.is_alive():
                process.join()
        self.logger.debug('Children dead')

