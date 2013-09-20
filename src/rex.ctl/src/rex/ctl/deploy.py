#
# Copyright (c) 2013, Prometheus Research, LLC
#


from cogs import env, setting, task, argument, option
from cogs.log import log, fail
from .common import make_rex, pair
from rex.core import get_settings, Error
from rex.deploy import existsdb, createdb, deploydb


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
        # Build the application.
        app = make_rex(self.project, self.require, self.set, False,
                       ensure='rex.deploy')
        # Create and deploy the database.
        try:
            with app:
                db = get_settings().db
                if not existsdb():
                    log("creating database `{}`", db)
                    createdb()
                log("deploying database schema to `{}`", db)
                deploydb()
        except Error, error:
            raise fail(str(error))


