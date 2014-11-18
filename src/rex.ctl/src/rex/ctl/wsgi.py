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
import hashlib
import subprocess
import yaml


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


@task
class START:
    """start a uWSGI server in daemon mode

    The `start` task starts a RexDB application under a uWSGI server
    running in daemon mode.

    This task takes one argument: the name of the primary RexDB package.
    Alternatively, the package could be specified using `project` setting.

    Use option `--require` or setting `requirements` to specify additional
    packages to include with the application.

    Use option `--set` or setting `parameters` to specify configuration
    parameters of the application.

    Use option `--set-uwsgi` or setting `uwsgi` to specify configuration
    of the uWSGI server.
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

    def __init__(self, project, require, set, set_uwsgi):
        self.project = project
        self.require = require
        self.set = set
        self.set_uwsgi = set_uwsgi

    def __call__(self):
        # Generate a unique identifier for the server from
        # one of: project name, `--config` value or current directory.
        ident = self.project
        if ident is None and env.config_file is not None:
            ident = os.path.abspath(env.config_file)
        if ident is None:
            ident = os.getcwd()
        ident = hashlib.md5(ident).hexdigest()[:6]
        # The directory to store `*.pid` and other files.
        run_dir = '/run/rex'
        if hasattr(sys, 'real_prefix'):
            run_dir = sys.prefix+run_dir
        if not os.path.exists(run_dir):
            os.makedirs(run_dir)
        yaml_path = os.path.join(run_dir, ident+'.yaml')
        pid_path = os.path.join(run_dir, ident+'.pid')
        log_path = os.path.join(run_dir, ident+'.log')
        wsgi_path = os.path.join(run_dir, ident+'.wsgi')
        # Verify if the process is already running.
        if os.path.exists(pid_path):
            try:
                pid = int(open(pid_path).read())
            except ValueError:
                pass
            else:
                try:
                    os.kill(pid, 0)
                except OSError:
                    pass
                else:
                    raise fail("application is already running")
        # Build the application; validate requirements and configuration.
        app = make_rex(self.project, self.require, self.set, ensure='rex.web')
        name = app.requirements[0]
        # Make a .wsgi script.
        with open(wsgi_path, 'w') as stream:
            for line in wsgi_file(app):
                stream.write(line)
        # Generate configuration file.
        if not env.uwsgi and not self.set_uwsgi:
            raise fail("missing uWSGI configuration")
        if os.path.exists(log_path):
            os.unlink(log_path)
        uwsgi_cfg = {}
        uwsgi_cfg['plugin'] = 'python'
        if hasattr(sys, 'real_prefix'):
            uwsgi_cfg['virtualenv'] = sys.prefix
        uwsgi_cfg.update(env.uwsgi)
        uwsgi_cfg.update(self.set_uwsgi)
        uwsgi_cfg['wsgi-file'] = wsgi_path
        uwsgi_cfg['logto'] = log_path
        uwsgi_cfg['daemonize2'] = log_path
        uwsgi_cfg['pidfile'] = pid_path
        cfg = { 'name': name, 'uwsgi': uwsgi_cfg }
        with open(yaml_path, 'w') as stream:
            yaml.dump(cfg, stream, default_flow_style=False)
        # Start uWSGI; catch errors if any.
        log("Starting `{}` ({})", name, pid_path)
        cmd = ['uwsgi', yaml_path]
        proc = subprocess.Popen(cmd,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT)
        out, err = proc.communicate()
        if proc.returncode != 0:
            sys.stderr.write(out)
            if os.path.exists(log_path):
                with open(log_path) as stream:
                    sys.stderr.write(stream.read())
            raise fail("non-zero exit code: `{}`",
                       subprocess.list2cmdline(cmd))


@task
class STOP:
    """stop a running uWSGI daemon

    The `start` task stops a uWSGI server running in daemon mode.

    This task takes one argument: the name of the primary RexDB package.
    Alternatively, the package could be specified using `project` setting.
    """

    project = argument(str, default=None)

    def __init__(self, project):
        self.project = project

    def __call__(self):
        # Generate a unique identifier for the server from
        # one of: project name, `--config` value or current directory.
        ident = self.project
        if ident is None and env.config_file is not None:
            ident = os.path.abspath(env.config_file)
        if ident is None:
            ident = os.getcwd()
        ident = hashlib.md5(ident).hexdigest()[:6]
        # The directory to store `*.pid` and other files.
        run_dir = '/run/rex'
        if hasattr(sys, 'real_prefix'):
            run_dir = sys.prefix+run_dir
        if not os.path.exists(run_dir):
            os.makedirs(run_dir)
        yaml_path = os.path.join(run_dir, ident+'.yaml')
        pid_path = os.path.join(run_dir, ident+'.pid')
        log_path = os.path.join(run_dir, ident+'.log')
        wsgi_path = os.path.join(run_dir, ident+'.wsgi')
        # Determine the project name and check if the daemon is running.
        name = pid = None
        if os.path.exists(yaml_path) and os.path.exists(pid_path):
            try:
                cfg = yaml.load(open(yaml_path))
            except yaml.YAMLError:
                pass
            else:
                if isinstance(cfg, dict):
                    name = cfg.get('name')
            try:
                pid = int(open(pid_path).read())
            except ValueError:
                pid = None
        if pid is not None:
            try:
                os.kill(pid, 0)
            except OSError:
                pid = None
        if name is None or pid is None:
            raise fail("application is not running")
        # Execute `uwsgi --stop`; remove `*.pid` and other files.
        log("Stopping `{}` ({})", name, pid_path)
        cmd = ['uwsgi', '--stop', pid_path]
        proc = subprocess.Popen(cmd)
        out, err = proc.communicate()
        for path in [yaml_path, pid_path, log_path, wsgi_path]:
            if os.path.exists(path):
                os.unlink(path)
        if proc.returncode != 0:
            raise fail("non-zero exit code: `{}`",
                       subprocess.list2cmdline(cmd))


