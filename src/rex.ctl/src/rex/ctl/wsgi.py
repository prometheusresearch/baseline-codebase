#
# Copyright (c) 2013, Prometheus Research, LLC
#


from cogs import env, setting, task, argument, option
from cogs.log import log, fail
from cogs.fs import exe
from .common import make_rex, pair, collection
from rex.core import Error, get_packages, get_settings
import sys
import shlex
import json
import os
import tempfile


def wsgi_file(app):
    # Generates a WSGI file for a Rex application.
    # Public project name.
    project = app.requirements[0]
    # Generate the script.
    yield "\n"
    yield "# WSGI script for the `%s` application.\n" % project
    yield "# Use it with `uwsgi`, `mod_wsgi` or any other WSGI container.\n"
    yield "\n"
    yield "from rex.core import Rex\n"
    yield "\n"
    yield "requirements = [\n"
    for name in app.requirements:
        yield "    %r,\n" % name
    yield "]\n"
    yield "\n"
    yield "parameters = {\n"
    for key in sorted(app.parameters):
        yield "    %r: %r,\n" % (key, app.parameters[key])
    yield "}\n"
    yield "\n"
    yield "application = Rex(*requirements, **parameters)\n"
    yield "\n"


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
        app = make_rex(self.project, self.require, self.set, initialize=False,
                       ensure='rex.web')
        try:
            with app:
                get_packages()
                get_settings()
        except Error, error:
            raise fail(str(error))
        # Generate the script.
        stream = sys.stdout
        if self.output is not None:
            stream = open(self.output, 'w')
        for line in wsgi_file(app):
            stream.write(line)


@setting
def UWSGI(config=None):
    """configuration of the uWSGI server

    A dictionary with uWSGI configuration parameters.
    """
    env.uwsgi = collection(config)


@task
class SERVE_UWSGI:
    """start a uWSGI server

    The `serve-uwsgi` task starts a RexDB application with a uWSGI server.

    This task takes one argument: the name of the primary RexDB package.
    Alternatively, the package could be specified using `project` setting.

    Use option `--require` or setting `requirements` to specify additional
    packages to include with the application.

    Use option `--set` or setting `parameters` to specify configuration
    parameters of the application.

    Use option `--set-uwsgi` or setting `uwsgi` to specify configuration
    of the uWSGI server.

    Toggle option `--watch` to automatically rebuild generated files
    that belong to the application.
    """

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")
    set = option(None, pair, default={}, plural=True,
            value_name="PARAM=VALUE",
            hint="set a configuration parameter")
    set_uwsgi = option(None, pair, default={}, plural=True,
            value_name="PARAM=VALUE",
            hint="set a uWSGI option")
    watch = option('w', bool,
            hint="rebuild generated files on the fly")

    def __init__(self, project, require, set, set_uwsgi, watch):
        self.project = project
        self.require = require
        self.set = set
        self.set_uwsgi = set_uwsgi
        self.watch = watch

    def __call__(self):
        # Build the application; validate requirements and configuration.
        app = make_rex(self.project, self.require, self.set,
                       detached_watch=self.watch, ensure='rex.web')
        # Make a temporary .wsgi file: /tmp/<project>-XXX.wsgi.
        fd, path = tempfile.mkstemp(prefix=app.requirements[0]+'-',
                                    suffix='.wsgi')
        stream = os.fdopen(fd, 'w')
        for line in wsgi_file(app):
            stream.write(line)
        # Doesn't work in some uwsgi configurations.
        #stream.write("import os\n")
        #stream.write("os.unlink(%r)\n" % path)
        #stream.write("\n")
        stream.close()
        # Load parameters to uWSGI and generate `uwsgi` command line.
        if not env.uwsgi and not self.set_uwsgi:
            raise fail("missing uWSGI configuration")
        uwsgi_parameters = {}
        uwsgi_parameters['need-app'] = True
        uwsgi_parameters['plugin'] = 'python'
        if hasattr(sys, 'real_prefix'):
            uwsgi_parameters['virtualenv'] = sys.prefix
        uwsgi_parameters.update(env.uwsgi)
        uwsgi_parameters.update(self.set_uwsgi)
        uwsgi_parameters['wsgi-file'] = path
        cmd = ['uwsgi']
        for key in sorted(uwsgi_parameters):
            value = uwsgi_parameters[key]
            cmd.append('--%s' % key)
            if value is not True:
                cmd.append(str(value))
        # Start uWSGI.
        log("Starting uWSGI server for `{}`", app.requirements[0])
        exe(cmd)


