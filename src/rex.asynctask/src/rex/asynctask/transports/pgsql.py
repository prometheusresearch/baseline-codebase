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

SQL_CREATE_TABLE = '''
DO LANGUAGE plpgsql $$
DECLARE
    current_version text;
    has_pre_versioned text;
BEGIN
    -- Figure out what version of the schema exists.
    SELECT
        obj_description(oid, 'pg_namespace')
    INTO
        current_version
    FROM
        pg_catalog.pg_namespace
    WHERE
        nspname = 'asynctask'
    ;

    IF current_version IS NULL THEN
        -- Schema doesn't exist, make everything.
        CREATE SCHEMA asynctask;

        CREATE TABLE asynctask.asynctask_queue (
            id BIGSERIAL,
            queue_name TEXT NOT NULL,
            payload JSON NOT NULL,
            date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        );

        CREATE INDEX idx_asynctask_queue_name
        ON asynctask.asynctask_queue (queue_name);

        -- Check to see if a pre-schema'ed table exists.
        SELECT
            'Y'
        INTO
            has_pre_versioned
        FROM
            information_schema.tables
        WHERE
            table_name = 'asynctask_queue'
            AND table_schema = 'public'
        ;
        IF has_pre_versioned = 'Y' THEN
            -- It does; move its records to the new table then get rid of it.
            INSERT INTO asynctask.asynctask_queue (
                queue_name,
                payload,
                date_submitted
            ) SELECT
                queue_name,
                payload,
                date_submitted
            FROM
                public.asynctask_queue
            ORDER BY
                id
            ;

            DROP TABLE public.asynctask_queue;
        END IF;

    ELSEIF current_version = 'version: 1' THEN
        -- Exists and is current, do nothing.
        NULL;

    END IF;

    COMMENT ON SCHEMA asynctask IS 'version: 1';
END;
$$;
'''

SQL_INSERT = '''
INSERT INTO asynctask.asynctask_queue (
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
    asynctask.asynctask_queue
WHERE
    queue_name = %s
ORDER BY
    id
LIMIT
    1
'''

SQL_DELETE = '''
DELETE FROM
    asynctask.asynctask_queue
WHERE
    id = %s
'''

SQL_COUNT = '''
SELECT COUNT(*)
FROM
    asynctask.asynctask_queue
WHERE
    queue_name = %s
'''


class PostgresAsyncTransport(AsyncTransport):
    """
    An implementation of AsyncTransport that uses a table in a Postgres
    database to store tasks while they're in a queue.

    Transport URI Examples:

    * pgsql:database
    * pgsql://hostname/database
    * pgsql://user:password@hostname:port/database?option=value
    * Any valid HTSQL connection URIs for the pgsql engine are allowed

    Available Options:

        master_lock_id
            The integer to use as the base of the mutex locks used within the
            database. You really should never need to touch this. If not
            specified, defaults to ``1234567890``.

    """

    #:
    name = 'pgsql'

    def __init__(self, uri_parts):
        self._lock_id_cache = {}

        parsed = DB.parse(urlunparse(uri_parts))
        self._connection_parameters = {
            'database': parsed.database.lstrip('/')
        }
        if parsed.host is not None:  # pragma: no cover
            self._connection_parameters['host'] = parsed.host
        if parsed.port is not None:  # pragma: no cover
            self._connection_parameters['port'] = parsed.port
        if parsed.username is not None:  # pragma: no cover
            self._connection_parameters['user'] = parsed.username
        if parsed.password is not None:  # pragma: no cover
            self._connection_parameters['password'] = parsed.password

        super(PostgresAsyncTransport, self).__init__(uri_parts)

    def initialize(self):
        self.master_lock_id = int(self.options.get(
            'master_lock_id',
            '1234567890',
        ))

        self._ensure_queue_table()

    def _ensure_queue_table(self):
        with self._lock('ENSURE QUEUE TABLE') as cur:
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

    def poll_queue(self, queue_name):
        self.ensure_valid_name(queue_name)
        with self._lock(queue_name) as cur:
            cur.execute(
                SQL_COUNT,
                (
                    queue_name,
                )
            )
            result = cur.fetchone()
            if result:
                result = int(result[0])
            return result

    def _get_connection(self):
        try:
            conn = psycopg2.connect(**self._connection_parameters)
            conn.set_client_encoding('UTF8')
            conn.autocommit = True
        except psycopg2.Error as exc:
            raise Error(
                'Failed to connect to the Postgres server:',
                exc,
            )
        else:
            return conn

    @contextmanager
    def _lock(self, name):
        cur = self._get_connection().cursor()
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
            int_hash = int(hashed[:8], 16)
            if int_hash >= (1 << 31):
                int_hash -= 1 << 32
            self._lock_id_cache[name] = int_hash
        return self._lock_id_cache[name]

    def __repr__(self):
        return '%s(%s/%s)' % (
            self.__class__.__name__,
            self._connection_parameters.get('host', 'localhost'),
            self._connection_parameters['database'],
        )

