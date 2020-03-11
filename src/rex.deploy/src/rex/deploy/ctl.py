#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import get_settings, Error, StrVal
from rex.ctl import RexTaskWithProject, option, env, log, fail, warn, debug, exe
from .cluster import get_cluster, deploy


class CreateDBTask(RexTaskWithProject):
    """create application database"""

    name = 'createdb'

    class options:
        quiet = option('q', hint="suppress logging")

    def __call__(self):
        with self.make(initialize=False):
            cluster = get_cluster()
            if cluster.exists():
                if not self.quiet:
                    log("Database `{}` already exists.", cluster.db)
            else:
                if not self.quiet:
                    log("Creating database `{}`.", cluster.db)
                cluster.create()


class DropDBTask(RexTaskWithProject):
    """delete application database"""

    name = 'dropdb'

    class options:
        quiet = option('q', hint="suppress logging")

    def __call__(self):
        with self.make(initialize=False):
            cluster = get_cluster()
            if not cluster.exists():
                if not self.quiet:
                    log("Database `{}` does not exist.", cluster.db)
            else:
                if not self.quiet:
                    log("Dropping database `{}`.", cluster.db)
                cluster.drop()


class DumpDBTask(RexTaskWithProject):
    """dump application database to a file"""

    name = 'dumpdb'

    class options:
        output = option(
                'o', default=None,
                value_name="FILE",
                hint="dump output to a file")
        quiet = option('q', hint="suppress logging")

    def __call__(self):
        with self.make(initialize=False):
            cluster = get_cluster()
            if not cluster.exists():
                raise fail("database `{}` does not exist", cluster.db)
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


class LoadDBTask(RexTaskWithProject):
    """load application database from a file"""

    name = 'loaddb'

    class options:
        input = option(
                'i', default=None,
                value_name="FILE",
                hint="load input from a file")
        quiet = option('q', hint="suppress logging")

    def __call__(self):
        with self.make(initialize=False):
            cluster = get_cluster()
            if not cluster.exists():
                if not self.quiet:
                    log("Creating database `{}`.", cluster.db)
                cluster.create()
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


class DeployTask(RexTaskWithProject):
    """deploy database schema

    Use ``deploy`` task to create and populate the application
    database.

    Use option ``--dry-run`` to immediately roll back any changes
    to the database.

    Use option ``--quiet`` to suppress any output.

    Use option ``--analyze`` to update database statistics.

    Toggle ``--debug`` to dump SQL statements submitted to
    the database server.
    """

    name = 'deploy'

    class options:
        dry_run = option(hint="immediately rollback the changes")
        quiet = option('q', hint="suppress logging")
        analyze = option(hint="update database statistics")

    def __call__(self):
        with self.make(initialize=False):
            cluster = get_cluster()
            if not cluster.exists():
                if not self.quiet:
                    log("Creating database `{}`.", cluster.db)
                cluster.create()
            if not self.quiet:
                log("Deploying application database to `{}`.", cluster.db)
            def logging(level, msg, *args, **kwds):
                if level == 'progress':
                    if not self.quiet:
                        log(msg, *args, **kwds)
                else:
                    debug(msg, *args, **kwds)
            deploy(logging=logging, dry_run=self.dry_run,
                   analyze=self.analyze)
            if not self.quiet:
                log("Done.")


