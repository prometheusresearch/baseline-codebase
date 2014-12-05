#
# Copyright (c) 2014, Prometheus Research, LLC
#


from cogs import env, task, argument, option
from cogs.log import log, fail
from .common import make_rex, pair
from .wsgi import wsgi_file
import sys
import os
import hashlib
import subprocess
import yaml


class attributes(object):
    # Properties derived from application configuration.

    def __init__(self, app):
        # Application name.
        self.name = app.requirements[0]
        # Project handle from the name and `--config` value.
        self.handle = self.name
        if env.config_file is not None:
            suffix = os.path.splitext(os.path.basename(env.config_file))[0]
            self.handle = "%s-%s" % (self.handle, suffix)
        # The directory to store `*.pid` and other files.
        self.run_dir = '/run/rex'
        if hasattr(sys, 'real_prefix'):
            self.run_dir = sys.prefix+self.run_dir
        self.yaml_path = os.path.join(self.run_dir, self.handle+'.yaml')
        self.pid_path = os.path.join(self.run_dir, self.handle+'.pid')
        self.log_path = os.path.join(self.run_dir, self.handle+'.log')
        self.wsgi_path = os.path.join(self.run_dir, self.handle+'.wsgi')


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
        form = attributes(app)
        # Create the directory to store `*.pid` and other files.
        if not os.path.exists(form.run_dir):
            os.makedirs(form.run_dir)
        # Verify if the process is already running.
        if os.path.exists(form.pid_path):
            try:
                pid = int(open(form.pid_path).read())
                os.kill(pid, 0)
            except (ValueError, OSError):
                pass
            else:
                raise fail("{} is already running", form.name)
        # Prepare uWSGI configuration file.
        uwsgi_cfg = {}
        uwsgi_cfg['need-app'] = True
        uwsgi_cfg['plugin'] = 'python'
        if hasattr(sys, 'real_prefix'):
            uwsgi_cfg['virtualenv'] = sys.prefix
        uwsgi_cfg.update(env.uwsgi)
        uwsgi_cfg.update(self.set_uwsgi)
        uwsgi_cfg['wsgi-file'] = form.wsgi_path
        uwsgi_cfg['logto'] = form.log_path
        uwsgi_cfg['daemonize2'] = form.log_path
        uwsgi_cfg['pidfile'] = form.pid_path
        uwsgi_cfg['master'] = True
        sockets = ["%s: %s" % (key, value)
                   for key, value in sorted(uwsgi_cfg.items())
                   if key == 'socket' or key.endswith('-socket')]
        if not sockets:
            raise fail("uWSGI sockets are not configured")
        cfg = { 'project': form.name, 'uwsgi': uwsgi_cfg }
        with open(form.yaml_path, 'w') as stream:
            yaml.dump(cfg, stream, default_flow_style=False)
        # Make a .wsgi script.
        with open(form.wsgi_path, 'w') as stream:
            for line in wsgi_file(app):
                stream.write(line)
        if os.path.exists(form.log_path):
            os.unlink(form.log_path)
        # Start uWSGI; catch errors if any.
        status = ", ".join(sockets+["logto: "+form.log_path])
        log("Starting `{}` ({})", form.name, status)
        cmd = ['uwsgi', form.yaml_path]
        proc = subprocess.Popen(cmd,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT)
        out, err = proc.communicate()
        if proc.returncode != 0:
            sys.stderr.write(out)
            if os.path.exists(form.log_path):
                with open(form.log_path) as stream:
                    sys.stderr.write(stream.read())
            raise fail("non-zero exit code: `{}`",
                       subprocess.list2cmdline(cmd))


@task
class STOP:
    """stop a running uWSGI daemon

    The `stop` task stops a uWSGI server running in daemon mode.

    This task takes one argument: the name of the primary RexDB package.
    Alternatively, the package could be specified using `project` setting.

    Use option `--require` or setting `requirements` to specify additional
    packages to include with the application.
    """

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")

    def __init__(self, project, require):
        self.project = project
        self.require = require

    def __call__(self):
        # Get the application properties.
        app = make_rex(self.project, self.require, initialize=False,
                       ensure='rex.web')
        form = attributes(app)
        # Get the daemon configuration and PID.
        uwsgi_cfg = {}
        pid = None
        if os.path.exists(form.yaml_path):
            try:
                cfg = yaml.load(open(form.yaml_path))
            except yaml.YAMLError:
                pass
            else:
                if isinstance(cfg, dict) and isinstance(cfg.get('uwsgi'), dict):
                    uwsgi_cfg = cfg['uwsgi']
        if os.path.exists(form.pid_path):
            try:
                pid = int(open(form.pid_path).read())
                os.kill(pid, 0)
            except (ValueError, OSError):
                pid = None
        if pid is None:
            raise fail("{} is not running", form.name)
        # Execute `uwsgi --stop`; remove `*.pid` and other files.
        sockets = ["%s: %s" % (key, value)
                   for key, value in sorted(uwsgi_cfg.items())
                   if key == 'socket' or key.endswith('-socket')]
        status = ", ".join(sockets+["logto: "+form.log_path])
        log("Stopping `{}` ({})", form.name, status)
        cmd = ['uwsgi', '--stop', form.pid_path]
        proc = subprocess.Popen(cmd)
        out, err = proc.communicate()
        if proc.returncode != 0:
            raise fail("non-zero exit code: `{}`",
                       subprocess.list2cmdline(cmd))
        # Kill the PID file if it is still there.
        if os.path.exists(form.pid_path):
            os.unlink(form.pid_path)


@task
class STATUS:
    """check if a uWSGI daemon is running

    The `status` task verifies if there is an active UWSGI server
    running in daemon model.

    This task takes one argument: the name of the primary RexDB package.
    Alternatively, the package could be specified using `project` setting.

    Use option `--require` or setting `requirements` to specify additional
    packages to include with the application.

    Use option `--pid` to print the process ID of the uWSGI daemon.

    Use option `--log` to print the name of the file with uWSGI logs.
    """

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")
    pid = option(None, bool,
            hint="print the daemon PID")
    log = option(None, bool,
            hint="print path to the log file")

    def __init__(self, project, require, pid, log):
        self.project = project
        self.require = require
        self.pid = pid
        self.log = log

    def __call__(self):
        # Get the application properties.
        app = make_rex(self.project, self.require, initialize=False,
                       ensure='rex.web')
        form = attributes(app)
        # Get the daemon configuration and PID.
        uwsgi_cfg = {}
        pid = None
        if os.path.exists(form.yaml_path):
            try:
                cfg = yaml.load(open(form.yaml_path))
            except yaml.YAMLError:
                pass
            else:
                if isinstance(cfg, dict) and isinstance(cfg.get('uwsgi'), dict):
                    uwsgi_cfg = cfg['uwsgi']
        if os.path.exists(form.pid_path):
            try:
                pid = int(open(form.pid_path).read())
                os.kill(pid, 0)
            except (ValueError, OSError):
                pid = None
        # Report the status.
        if not self.pid and not self.log:
            if pid is None:
                log("`{}` is not running", form.name)
            else:
                sockets = ["%s: %s" % (key, value)
                           for key, value in sorted(uwsgi_cfg.items())
                           if key == 'socket' or key.endswith('-socket')]
                status = ", ".join(sockets+["logto: "+form.log_path])
                log("`{}` is running ({})", form.name, status)
        elif pid is not None:
            if self.pid:
                log("{}", pid)
            if self.log:
                log("{}", form.log_path)


