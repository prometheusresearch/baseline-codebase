#
# Copyright (c) 2015, Prometheus Research, LLC
#


import hashlib

from contextlib import contextmanager
from urlparse import urlunparse

import psycopg2

from htsql.core.util import DB
from rex.core import Error

from .base import AsyncTransport


__all__ = (
    'PostgresAsyncTransport',
)


SQL_LOCK = 'SELECT pg_advisory_lock(%s, %s)'

SQL_UNLOCK = 'SELECT pg_advisory_unlock(%s, %s)'

SQL_CHECK_TABLE = '''
SELECT
    1
FROM
    information_schema.tables
WHERE
    table_name = 'asynctask_queue'
'''

SQL_CREATE_TABLE = '''
CREATE TABLE asynctask_queue (
    id BIGSERIAL,
    queue_name TEXT NOT NULL,
    payload JSON NOT NULL,
    date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
)
'''

SQL_INSERT = '''
INSERT INTO asynctask_queue (
    queue_name,
    payload
) VALUES (
    %s,
    %s
)
'''

SQL_RETRIEVE = '''
SELECT
    id,
    payload,
    date_submitted
FROM
    asynctask_queue
WHERE
    queue_name = %s
ORDER BY
    id
LIMIT
    1
'''

SQL_DELETE = '''
DELETE FROM
    asynctask_queue
WHERE
    id = %s
'''


class PostgresAsyncTransport(AsyncTransport):
    """

    Transport URI Examples:
        <Any valid HTSQL connection URIs for the pgsql engine>

    Options:
        master_lock_id
            The integer to use as the base of the mutex locks used within the
            database. You really should never need to touch this. If not
            specified, defaults to 1234567890.

    """

    name = 'pgsql'

    def __init__(self, uri_parts):
        self.uri = urlunparse(uri_parts)
        self._lock_id_cache = {}
        super(PostgresAsyncTransport, self).__init__(uri_parts)

    def initialize(self):
        parsed = DB.parse(self.uri)
        parameters = {
            'database': parsed.database
        }
        if parsed.host is not None:
            parameters['host'] = parsed.host
        if parsed.port is not None:
            parameters['port'] = parsed.port
        if parsed.username is not None:
            parameters['user'] = parsed.username
        if parsed.password is not None:
            parameters['password'] = parsed.password
        try:
            self._connection = psycopg2.connect(**parameters)
            self._connection.set_client_encoding('UTF8')
            self._connection.autocommit = True
        except psycopg2.Error, error:
            raise Error(
                'Failed to connect to the database server:',
                error,
            )

        self.master_lock_id = int(self.options.get(
            'master_lock_id',
            '1234567890',
        ))

        self._ensure_queue_table()

    def _ensure_queue_table(self):
        with self._lock('ENSURE QUEUE TABLE') as cur:
            cur.execute(SQL_CHECK_TABLE)
            recs = cur.fetchall()
            if not recs:
                cur.execute(SQL_CREATE_TABLE)

    def submit_task(self, queue_name, payload):
        self.ensure_valid_name(queue_name)
        payload = self.encode_payload(payload)

        with self._lock(queue_name) as cur:
            cur.execute(
                SQL_INSERT,
                (
                    queue_name,
                    payload,
                )
            )

    def get_task(self, queue_name):
        self.ensure_valid_name(queue_name)
        payload = None

        with self._lock(queue_name) as cur:
            cur.execute(
                SQL_RETRIEVE,
                (
                    queue_name,
                )
            )
            recs = cur.fetchall()
            if recs:
                payload = self.decode_payload(recs[0][1])
                cur.execute(
                    SQL_DELETE,
                    (
                        recs[0][0],
                    )
                )
        return payload

    @contextmanager
    def _lock(self, name):
        cur = self._connection.cursor()
        cur.execute(
            SQL_LOCK,
            (
                self.master_lock_id,
                self._get_lock_id(name),
            )
        )
        try:
            yield cur
        finally:
            cur.execute(
                SQL_UNLOCK,
                (
                    self.master_lock_id,
                    self._get_lock_id(name),
                )
            )
            cur.close()

    def _get_lock_id(self, name):
        if name not in self._lock_id_cache:
            hashed = hashlib.sha1(name).hexdigest()
            self._lock_id_cache[name] = int(hashed[:8], 16)
        return self._lock_id_cache[name]
