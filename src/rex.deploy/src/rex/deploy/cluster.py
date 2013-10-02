#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import get_settings, Error
from .fact import Driver
from .write import select_database, create_database, drop_database
import htsql.core.util
import psycopg2, psycopg2.extensions


class Cluster(object):

    def __init__(self, db):
        self.db = htsql.core.util.DB.parse(db)

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, str(self.db))

    def connect(self, database=None, autocommit=False):
        if database is None:
            database = self.db.database
        parameters = { 'database': database }
        if self.db.host is not None:
            parameters['host'] = self.db.host
        if self.db.port is not None:
            parameters['port'] = self.db.port
        if self.db.username is not None:
            parameters['user'] = self.db.username
        if self.db.password is not None:
            parameters['password'] = self.db.password
        try:
            connection = psycopg2.connect(**parameters)
            connection.set_client_encoding('UTF8')
            if autocommit:
                connection.autocommit = True
        except psycopg2.Error, error:
            raise Error("Failed to connect to the database server:", error)
        return connection

    def connect_postgres(self):
        return self.connect('postgres', autocommit=True)

    def exists(self, database=None):
        if database is None:
            database = self.db.database
        sql = select_database(database)
        return bool(self._master(database, sql))

    def create(self, database=None):
        if database is None:
            database = self.db.database
        sql = create_database(database)
        self._master(database, sql)

    def drop(self, database=None):
        if database is None:
            database = self.db.database
        sql = drop_database(database)
        self._master(database, sql)

    def deploy(self, facts, database=None, dry_run=False):
        connection = self.connect(database)
        try:
            driver = Driver(connection)
            driver(facts)
            if not dry_run:
                connection.commit()
            else:
                connection.rollback()
            connection.close()
        except psycopg2.Error, error:
            raise Error("Got an error from the database server:", error)

    def _master(self, database, sql):
        if database is None:
            database = self.db.database
        result = None
        connection = self.connect_postgres()
        try:
            cursor = connection.cursor()
            cursor.execute(sql)
            if cursor.description is not None:
                result = cursor.fetchall()
            connection.close()
        except psycopg2.Error, error:
            raise Error("Got an error from the database server:", error)
        return result


def get_cluster():
    db = get_settings().db
    if not db.engine == 'pgsql':
        raise Error("Expected a PostgreSQL database; got:", db)
    return Cluster(db)


