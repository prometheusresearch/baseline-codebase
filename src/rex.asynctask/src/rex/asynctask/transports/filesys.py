#
# Copyright (c) 2017, Prometheus Research, LLC
#

import os
import stat

from .base import AsyncTransport


__all__ = (
    'FileSysAsyncTransport',
)


FILE_LOCK = '.lock'
FILE_INDEX = '.index'


class FileSysAsyncTransport(AsyncTransport):
    """
    An implementation of AsyncTransport that uses the filesystem to store tasks
    while they're in a queue.

    Transport URI Examples:

    * filesys:/path/to/queue/directory
    * filesys:/path/to/queue/directory?option1=value&option2=value

    Available Options:

        lock_timeout
            The maximum number of seconds to wait when obtaining a lock to
            access a queue. Defaults to ``-1``, which means no maximum.

        file_mode
            The file mode to apply to directories/files that are created by
            this transport. Defaults to ``0600``.
    """

    #:
    name = 'filesys'

    def initialize(self):
        self._locks = {}

        self.options['lock_timeout'] = \
            int(self.options.get('lock_timeout', '-1'))

        self.options['file_mode'] = \
            int(self.options.get('file_mode', '0600'), 8)

        if not os.path.exists(self.path):
            os.makedirs(self.path, self.options['file_mode'] | stat.S_IXUSR)

    def submit_task(self, queue_name, payload):
        self._ensure_queue(queue_name)

        full_payload = self.encode_payload({
            'payload': payload,
        })

        with self._lock(queue_name):
            index = self._get_index(queue_name)
            next_start = index[0] or 1
            next_end = index[1] + 1

            path = os.path.join(self._queue_path(queue_name), str(next_end))
            self._write_file(path, full_payload)

            self._write_index(queue_name, next_start, next_end)

    def get_task(self, queue_name):
        self._ensure_queue(queue_name)

        with self._lock(queue_name):
            index = self._get_index(queue_name)
            if index[1] == 0:
                return None

            path = os.path.join(self._queue_path(queue_name), str(index[0]))
            with open(path, 'r') as task_file:
                contents = task_file.read()
            os.remove(path)

            next_start = index[0] + 1
            next_end = index[1]
            if next_start > next_end:
                next_start = next_end = 0
            self._write_index(queue_name, next_start, next_end)

        contents = self.decode_payload(contents)
        return contents['payload']

    def poll_queue(self, queue_name):
        self._ensure_queue(queue_name)

        with self._lock(queue_name):
            index = self._get_index(queue_name)

        if index[1] == 0:
            return 0

        return (index[1] - index[0]) + 1

    def _queue_path(self, queue_name):
        return os.path.join(self.path, queue_name)

    def _ensure_queue(self, queue_name):
        self.ensure_valid_name(queue_name)
        path = self._queue_path(queue_name)
        if not os.path.exists(path):
            os.makedirs(path, self.options['file_mode'] | stat.S_IXUSR)
        if not os.path.exists(os.path.join(path, FILE_INDEX)):
            with self._lock(queue_name):
                self._write_index(queue_name, 0, 0)

    def _lock(self, queue_name):
        if queue_name not in self._locks:
            import filelock
            self._locks[queue_name] = filelock.FileLock(
                os.path.join(self._queue_path(queue_name), FILE_LOCK),
                timeout=self.options['lock_timeout'],
            )
        return self._locks[queue_name]

    def _get_index(self, queue_name):
        path = os.path.join(self.path, queue_name, FILE_INDEX)
        contents = open(path, 'r').read()
        return [
            int(value)
            for value in contents.split(',')
        ]

    def _write_index(self, queue_name, start, end):
        path = os.path.join(self.path, queue_name, FILE_INDEX)
        self._write_file(path, '%s,%s' % (start, end))

    def _write_file(self, path, contents):
        fdesc = os.open(
            path,
            os.O_WRONLY | os.O_CREAT,
            self.options['file_mode'],
        )
        file_ = os.fdopen(fdesc, 'w')
        file_.write(contents)
        file_.close()

