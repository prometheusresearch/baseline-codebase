#
# Copyright (c) 2013, Prometheus Research, LLC
#


from cogs import task, argument, option
from cogs.log import fail
from .common import make_rex, pair
from rex.core import Error
from rex.db import get_db
import htsql.core.validator, htsql.ctl, htsql.ctl.error, htsql.ctl.shell
import sys


def extension(value):
    validate = htsql.core.validator.ExtensionVal()
    return dict([validate(value)])


class RexShellRoutine(htsql.ctl.shell.ShellRoutine):

    arguments = []
    options = []

    def __init__(self, script, app):
        super(RexShellRoutine, self).__init__(script, {})
        self.app = app

    def run(self):
        self.start(self.app)


@task
class SHELL:
    """open HTSQL shell

    The `shell` task opens an HTSQL shell to the application database.

    This task takes one argument: the name of the primary RexDB package.
    Alternatively, the package could be specified using `project` setting.

    Use option `--require` or setting `requirements` to specify additional
    packages to include with the application.

    Use option `--set` or setting `parameters` to specify configuration
    parameters of the application.

    Use option `--extend` (`-E`) to enable an HTSQL extension.

    Use option `--gateway` (`-G`) to connect to a secondary application
    database.
    """

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")
    set = option(None, pair, default={}, plural=True,
            value_name="PARAM=VALUE",
            hint="set a configuration parameter")
    extend = option('E', extension, default=[], plural=True,
            value_name="EXT:PARAM=VALUE",
            hint="include an HTSQL extension")
    gateway = option('G', str, default=None,
            value_name="NAME",
            hint="connect to a gateway database")

    def __init__(self, project, require, set, extend, gateway):
        self.project = project
        self.require = require
        self.set = set
        self.extend = list(extend)
        self.gateway = gateway

    def __call__(self):
        # Build the application and extract HTSQL configuration.
        set_list = dict(self.set)
        if self.extend:
            set_list['htsql_extensions'] = self.extend
        app = make_rex(self.project, self.require, set_list, False,
                       ensure='rex.db')
        try:
            with app:
                db = get_db(self.gateway)
        except Error, error:
            raise fail(str(error))
        if db is None:
            raise fail("unknown gateway: `{}`", self.gateway)
        # Run `htsql-ctl shell`.
        script = htsql.ctl.HTSQL_CTL(sys.stdin, sys.stdout, sys.stderr)
        routine = RexShellRoutine(script, db)
        try:
            routine.run()
        except htsql.ctl.error.ScriptError, error:
            raise fail(str(error))


