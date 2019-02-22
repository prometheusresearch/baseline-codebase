#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import get_packages, get_settings, Error, cached
from .fact import Driver
from .sql import (sql_select_database, sql_create_database, sql_drop_database,
        sql_rename_database)
import htsql.core.util
import datetime
import psycopg2, psycopg2.extensions, psycopg2.extras


psycopg2.extras.register_default_json(loads=lambda x: x)
psycopg2.extras.register_default_jsonb(loads=lambda x: x)


class Cluster:
    """
    Represents a PostgreSQL cluster of databases.

    `db`
        HTSQL connection URI.  Server parameters are used to connect
        to the cluster.  The database name is used as the default
        name for database operations.
    """

    def __init__(self, db):
        self.db = htsql.core.util.DB.parse(db)

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, str(self.db))

    def connect(self, name=None, autocommit=False):
        """
        Creates and returns a connection to a database from the cluster.

        `name`
            Database name; if not set, connect to the database specified
            in the :class:`Cluster` constructor.
        `autocommit`
            If set, set the connection to autocommit mode.
        """
        parameters = { 'database': name or self.db.database }
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
            psycopg2.extensions.register_type(psycopg2.extensions.UNICODE,
                                              connection)
            psycopg2.extensions.register_type(psycopg2.extensions.UNICODEARRAY,
                                              connection)
            connection.set_client_encoding('UTF8')
            if autocommit:
                connection.autocommit = True
        except psycopg2.Error as error:
            raise Error("Failed to connect to the database server:", error)
        return connection

    def exists(self, name=None):
        """Returns ``True`` if the database exists in the cluster."""
        sql = sql_select_database(name or self.db.database)
        return bool(self._master(sql))

    def create(self, name=None, template=None):
        """Creates a new database in the cluster."""
        sql = sql_create_database(name or self.db.database, template=template)
        self._master(sql)

    def clone(self, template, name=None):
        """Creates a copy of the template database."""
        self.create(name, template)

    def rename(self, new_name, name=None):
        """Renames an existing database."""
        sql = sql_rename_database(name or self.db.database, new_name=new_name)
        self._master(sql)

    def drop(self, name=None):
        """Deletes a database."""
        sql = sql_drop_database(name or self.db.database)
        self._master(sql)

    def overwrite(self, name=None):
        """
        Creates a new database from scratch.  If the database with the same
        name already exists, it is deleted first.
        """
        if self.exists(name):
            self.drop(name)
        self.create(name)

    def drive(self, name=None, logging=False):
        """
        Creates a :class:`rex.deploy.Driver` instance for the database.
        """
        connection = self.connect(name)
        return Driver(connection, logging=logging)

    def _master(self, sql):
        # Executes `sql` against the master database; returns the output.
        result = None
        connection = self.connect('postgres', autocommit=True)
        try:
            cursor = connection.cursor()
            cursor.execute(sql)
            if cursor.description is not None:
                result = cursor.fetchall()
            connection.close()
        except psycopg2.Error as error:
            raise Error("Got an error from the database server:", error)
        return result


@cached
def get_cluster():
    """
    Get a cluster associated with the application database.
    """
    settings = get_settings()
    # Extract the connection URI from `db` setting.
    db = settings.db
    if isinstance(db, dict):
        db = db.get('htsql', {}).get('db')
    if db is None or db.engine != 'pgsql':
        raise Error("Expected a PostgreSQL database; got:", db)
    return Cluster(db)


def deploy(logging=False, dry_run=False, analyze=False):
    """
    Deploys and validates the application schema from ``deploy.yaml``
    files.

    `logging`
        Logging configuration for the deployment driver.
    `dry_run`
        If set, the changes are rolled back at the end of the deployment.
    `analyze`
        If set, update database statistics at the end of the deployment.
    """
    time_start = datetime.datetime.now()
    # Prepare the driver.
    cluster = get_cluster()
    driver = cluster.drive(logging=logging)
    try:
        packages = [package for package in reversed(get_packages())
                            if package.exists('deploy.yaml')]
        if not packages:
            driver.log_progress("Nothing to deploy.")
            return
        facts_by_package = {}
        # Load and parse `deploy.yaml` files.
        for package in packages:
            driver.chdir(package.abspath('/'))
            package_facts = driver.parse(package.open('deploy.yaml'))
            if not isinstance(package_facts, list):
                package_facts = [package_facts]
            facts_by_package[package] = package_facts
        driver.chdir(None)
        # Deploying database schema.
        for package in packages:
            driver.log_progress("Deploying {}.", package.name)
            facts = facts_by_package[package]
            driver(facts)
        # Validating directives.
        driver.reset()
        driver.lock()
        for package in packages:
            driver.log_progress("Validating {}.", package.name)
            facts = facts_by_package[package]
            driver(facts)
        driver.unlock()
        # Commit changes and report.
        if not dry_run:
            driver.commit()
        else:
            driver.log_progress("Rolling back changes (dry run).")
            driver.rollback()
        # post-commit statistics analysis
        if analyze:
            driver.log_progress("Updating database statistics.")
            driver.analyze()
    finally:
        time_end = datetime.datetime.now()
        driver.log_timing("Total time: {}", time_end-time_start)
        driver.close()


