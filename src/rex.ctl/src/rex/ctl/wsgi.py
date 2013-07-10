#
# Copyright (c) 2013, Prometheus Research, LLC
#


from cogs import env, task, argument, option
from cogs.log import fail
from .common import make_rex, pair
from rex.core import Error, get_packages, get_settings
import sys


@task
class WSGI:
    """generate a WSGI script

    The `wsgi` task generates a WSGI script for a RexDB application, which
    could be used with `uwsgi`, `mod_wsgi` or any other WSGI container.

    This task takes one argument: the name of the primary RexDB package.
    Alternatively, the package could be specified using `project` setting.

    Use option `--require` or setting `requirements` to specify additional
    packages to include with the application.

    Use option `--set` or setting `parameters` to specify configuration
    parameters of the application.

    Use option `--output` to specify where to write the generated script.
    """

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")
    set = option(None, pair, default={}, plural=True,
            value_name="PARAM=VALUE",
            hint="set a configuration parameter")
    output = option('o', str, default=None,
            value_name="FILE",
            hint="write the script to a file")

    def __init__(self, project, require, set, output):
        self.project = project
        self.require = require
        self.set = set
        self.output = output if output != '-' else None

    def __call__(self):
        # Build the application; validate requirements and configuration.
        app = make_rex(self.project, self.require, self.set, initialize=False)
        try:
            with app:
                get_packages()
                get_settings()
        except Error, error:
            raise fail(str(error))
        # Public project name.
        project = self.project or env.project
        # Generate the script.
        stream = sys.stdout
        if self.output is not None:
            stream = open(self.output, 'w')
        stream.write("\n")
        stream.write("# WSGI script for %s.\n"
                     % (("the `%s` application" % project)
                        if project is not None else "a RexDB application"))
        stream.write("# Use it with `uwsgi`, `mod_wsgi`"
                     " or any other WSGI container.\n")
        stream.write("\n")
        stream.write("from rex.core import Rex\n")
        stream.write("\n")
        stream.write("requirements = [\n")
        for name in app.requirements:
            stream.write("    %r,\n" % name)
        stream.write("]\n")
        stream.write("\n")
        stream.write("parameters = {\n")
        for key in sorted(app.parameters):
            stream.write("    %r: %r,\n" % (key, app.parameters[key]))
        stream.write("}\n")
        stream.write("\n")
        stream.write("application = Rex(*requirements, **parameters)\n")
        stream.write("\n")


