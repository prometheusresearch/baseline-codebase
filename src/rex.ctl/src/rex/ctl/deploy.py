#
# Copyright (c) 2013, Prometheus Research, LLC
#


from cogs import env, setting, task, argument, option
from cogs.log import log, fail
from cogs.fs import exe
from .common import make_rex, pair
from rex.core import get_settings, Error
from rex.deploy import get_cluster, deploy


@task
class CREATEDB:
    """create application database"""

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")
    set = option(None, pair, default={}, plural=True,
            value_name="PARAM=VALUE",
            hint="set a configuration parameter")

    def __init__(self, project, require, set):
        self.project = project
        self.require = require
        self.set = set

    def __call__(self):
        app = make_rex(self.project, self.require, self.set, False,
                       ensure='rex.deploy')
        try:
            with app:
                cluster = get_cluster()
            if cluster.exists():
                log("Database `{}` already exists.", cluster.db)
            else:
                log("Creating database `{}`.", cluster.db)
                cluster.create()
        except Error, error:
            raise fail(str(error))


@task
class DROPDB:
    """delete application database"""

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")
    set = option(None, pair, default={}, plural=True,
            value_name="PARAM=VALUE",
            hint="set a configuration parameter")

    def __init__(self, project, require, set):
        self.project = project
        self.require = require
        self.set = set

    def __call__(self):
        app = make_rex(self.project, self.require, self.set, False,
                       ensure='rex.deploy')
        try:
            with app:
                cluster = get_cluster()
            if not cluster.exists():
                log("Database `{}` does not exist.", cluster.db)
            else:
                log("Dropping database `{}`.", cluster.db)
                cluster.drop()
        except Error, error:
            raise fail(str(error))


@task
class DUMPDB:
    """dump application database"""

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")
    set = option(None, pair, default={}, plural=True,
            value_name="PARAM=VALUE",
            hint="set a configuration parameter")
    output = option('o', str, default=None,
            value_name="FILE",
            hint="dump output to a file")

    def __init__(self, project, require, set, output):
        self.project = project
        self.require = require
        self.set = set
        self.output = output

    def __call__(self):
        app = make_rex(self.project, self.require, self.set, False,
                       ensure='rex.deploy')
        try:
            with app:
                cluster = get_cluster()
            if not cluster.exists():
                raise fail("database `{}` does not exist", cluster.db)
        except Error, error:
            raise fail(str(error))
        db = cluster.db
        command = ['pg_dump']
        if db.host:
            command.append('--host')
            command.append(db.host)
        if db.port:
            command.append('--port')
            command.append(str(db.port))
        if db.username:
            command.append('--username')
            command.append(db.username)
        if db.password:
            command.append('--password')    # force password prompt
#            raise fail("cannot invoke `pg_dump`"
#                       " on a password-protected database")
        command.append('--no-owner')
        if self.output and self.output != '-':
            command.append('--file')
            command.append(self.output)
        command.append(db.database)
        exe(command)


@task
class LOADDB:
    """load application database"""

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")
    set = option(None, pair, default={}, plural=True,
            value_name="PARAM=VALUE",
            hint="set a configuration parameter")
    input = option('i', str, default=None,
            value_name="FILE",
            hint="load input from a file")

    def __init__(self, project, require, set, input):
        self.project = project
        self.require = require
        self.set = set
        self.input = input

    def __call__(self):
        app = make_rex(self.project, self.require, self.set, False,
                       ensure='rex.deploy')
        try:
            with app:
                cluster = get_cluster()
            if not cluster.exists():
                log("Creating database `{}`.", cluster.db)
                cluster.create()
        except Error, error:
            raise fail(str(error))
        db = cluster.db
        command = ['psql']
        if db.host:
            command.append('--host')
            command.append(db.host)
        if db.port:
            command.append('--port')
            command.append(str(db.port))
        if db.username:
            command.append('--username')
            command.append(db.username)
        if db.password:
            command.append('--password')    # force password prompt
#            raise fail("cannot invoke `pg_dump`"
#                       " on a password-protected database")
        command.append('--single-transaction')
        command.append('--output')
        command.append('/dev/null')
        command.append('--set')
        command.append('ON_ERROR_STOP=1')
        if self.input and self.input != '-':
            command.append('--file')
            command.append(self.input)
        command.append(db.database)
        exe(command)


@task
class DEPLOY:
    """deploy database schema

    The `deploy` task brings the database to the state prescribed by
    the application.

    This task takes one argument: the name of the primary RexDB package.
    Alternatively, the package could be specified using `project` setting.

    Use option `--require` or setting `requirements` to specify additional
    packages to include with the application.

    Use option `--set` or setting `parameters` to specify configuration
    parameters of the application.
    """

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")
    set = option(None, pair, default={}, plural=True,
            value_name="PARAM=VALUE",
            hint="set a configuration parameter")
    dry_run = option(None, bool,
            hint="immediately rollback the changes")

    def __init__(self, project, require, set, dry_run):
        self.project = project
        self.require = require
        self.set = set
        self.dry_run = dry_run

    def __call__(self):
        app = make_rex(self.project, self.require, self.set, False,
                       ensure='rex.deploy')
        try:
            with app:
                cluster = get_cluster()
            if not cluster.exists():
                log("Creating database `{}`.", cluster.db)
                cluster.create()
            log("Deploying application database to `{}`.", cluster.db)
            with app:
                deploy(dry_run=self.dry_run)
        except Error, error:
            raise fail(str(error))


