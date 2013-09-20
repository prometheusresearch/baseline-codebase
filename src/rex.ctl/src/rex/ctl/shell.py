#
# Copyright (c) 2013, Prometheus Research, LLC
#


from cogs import task, argument, option
from cogs.log import fail
from .common import make_rex, pair
from rex.core import get_settings, Error
import htsql.core.validator, htsql.ctl, htsql.ctl.error, htsql.ctl.shell
import sys


def extension(value):
    validate = htsql.core.validator.ExtensionVal()
    return dict([validate(value)])


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

    def __init__(self, project, require, set, extend):
        self.project = project
        self.require = require
        self.set = set
        self.extend = list(extend)

    def __call__(self):
        # Build the application and extract HTSQL configuration.
        app = make_rex(self.project, self.require, self.set, False,
                       ensure='rex.db')
        try:
            with app:
                settings = get_settings()
        except Error, error:
            raise fail(str(error))
        extensions = []
        extensions.extend(self.extend)
        extensions.append({'rex': {}})
        if settings.htsql_extensions:
            if isinstance(settings.htsql_extensions, list):
                extensions.extend(settings.htsql_extensions)
            else:
                extensions.append(settings.htsql_extensions)
        # Parameters for `shell` invocation.
        attributes = {
                'db': settings.db,
                'password': False,
                'extensions': extensions,
                'config': None,
        }
        # Run `htsql-ctl shell`.
        script = htsql.ctl.HTSQL_CTL(sys.stdin, sys.stdout, sys.stderr)
        routine = htsql.ctl.shell.ShellRoutine(script, attributes)
        try:
            routine.run()
        except htsql.ctl.error.ScriptError, error:
            raise fail(str(error))


