#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.setup import watch
from rex.core import (
        get_packages, get_settings, Error, PythonPackage, StrVal, PIntVal,
        BoolVal, MaybeVal, MapVal, Validate)
from rex.ctl import (
        env, RexTask, Global, Topic, argument, option, log, fail, exe)
import sys
import os
import time
import tempfile
import shlex
import hashlib
import binascii
import datetime
import traceback
import socketserver
import json
import subprocess
import atexit
import wsgiref.simple_server, wsgiref.handlers, wsgiref.util
import json
import math
import marshal
import io
import cProfile


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


class RexServer(socketserver.ThreadingMixIn,
                wsgiref.simple_server.WSGIServer,
                object):
    # HTTP server that spawns a thread for each request.

    # Preset WSGI `environ` dictionary.
    environ = {}
    # Whether to dump HTTP logs.
    quiet = None

    @classmethod
    def make(cls, environ, quiet):
        # Builds a subclass with the given class parameters.
        context = {
            'environ': environ,
            'quiet': quiet,
        }
        return type(cls.__name__, (cls,), context)


class RexRequestHandler(wsgiref.simple_server.WSGIRequestHandler, object):
    # Provides customized logging.

    def handle(self):
        # Overridden to replace `ServerHandler` with `RexServerHandler`.
        self.raw_requestline = self.rfile.readline()
        if not self.parse_request():
            return
        handler = RexServerHandler(
            self.rfile, self.wfile, self.get_stderr(), self.get_environ())
        handler.request_handler = self
        handler.run(self.server.get_app())

    def get_environ(self):
        # Sets REMOTE_USER.
        environ = super(RexRequestHandler, self).get_environ()
        environ.update(self.server.environ)
        return environ

    def log_message(self, format, *args):
        # Dumps a log message in the Apache Common Log Format.

        # The server was started with `--quiet` option.
        if self.server.quiet:
            return

        if format != '"%s" %s %s':
            # Non-standard format from `log_error()`, must be a parsing error
            # or timeout.
            log(":warning:`Invalid request:` {}", format % args)
            return

        # Extract the remote user.
        remote_user = self.server.environ.get('REMOTE_USER') or '-'

        # Highlight query strings and error codes.
        query, status, size = args
        if status < '400':
            line = "{} - {} [{}] \"`{}`\" {} {}"
        else:
            line = "{} - {} [{}] \"`{}`\" :warning:`{}` {}"
        log(line,
            self.address_string(),
            remote_user,
            self.log_date_time_string(),
            query,
            status,
            size)


class RexServerHandler(wsgiref.handlers.SimpleHandler):
    # Customizes output for unhandled exceptions and support for
    # X-Forwarded-Proto.

    def log_exception(self, exc_info):
        # Dumps the exception traceback to stderr.
        try:
            stderr = self.get_stderr()
            stderr.write("-"*70+"\n")
            for line in self.format_exception(exc_info):
                stderr.write(line)
            stderr.flush()
            # Add a line to access log.
            if self.headers_sent:
                self.request_handler.log_request(
                        self.status.split(' ',1)[0], self.bytes_sent)
        finally:
            exc_info = None

    def format_exception(self, exc_info):
        # Generates enhanced traceback output.
        try:
            lines = []
            lines.append("[%s] %s => %s\n"
                         % (datetime.datetime.now(),
                            self.environ['REMOTE_HOST'],
                            wsgiref.util.request_uri(self.environ)))
            lines.extend(traceback.format_exception(*exc_info))
            return lines
        finally:
            exc_info = None

    def finish_response(self):
        # Overridden to fix a problem with `self.close()` called twice and
        # add a line to access log.
        if not self.result_is_file() or not self.sendfile():
            for data in self.result:
                self.write(data)
            self.finish_content()
        # Add a line to access log.
        self.request_handler.log_request(
                self.status.split(' ',1)[0], self.bytes_sent)
        # Note that `close()` is not called if an exception occurs above.
        # If this happens, the final `close()` is called in `BaseHandler.run()`.
        self.close()

    def get_scheme(self):
        # X-Forwarded-Proto appears to be a de facto standard for identifying
        # the originating protocol of an HTTP request when the web server is
        # behind a reverse proxy.
        scheme = self.environ.get('HTTP_X_FORWARDED_PROTO')
        if not scheme:
            scheme = wsgiref.handlers.SimpleHandler.get_scheme(self)
        return scheme


class HTTPHostGlobal(Global):
    """HTTP server address

    The default address of the HTTP server.
    """

    name = 'http-host'
    value_name = 'HOSTNAME'
    default = '127.0.0.1'
    validate = StrVal()


class HTTPPortGlobal(Global):
    """HTTP server port

    The default port number for the HTTP server.
    """

    name = 'http-port'
    value_name = 'PORT'
    default = 8080
    validate = PIntVal(65535)


class UWSGIGlobal(Global):
    """configuration of the uWSGI server

    A dictionary with uWSGI configuration parameters.
    """
    name = 'uwsgi'
    value_name = 'CONFIG'
    validate = MaybeVal(MapVal(StrVal))
    default = {}


class ReplayLogGlobal(Global):
    """path to the replay log

    The file containing the log of all incoming requests.
    """
    name = 'replay-log'
    value_name = 'LOG'
    validate = StrVal()
    default = None


class RexWatchTask(RexTask):
    # Provides automatic watch daemon for the application.

    class options:
        watch = option('w', BoolVal(), hint="deprecated")
        watch_package = option(
                'W', StrVal(),
                value_name="PACKAGE",
                plural=True,
                default=[],
                hint="deprecated")

    def make_with_watch(self, *args, **kwds):
        if self.watch:
            raise Error(
                'Option "--watch" is deprecated',
                'Use "rex watch" command instead')
        if self.watch_package:
            raise Error(
                'Option "--watch-package PACKAGE" is deprecated',
                'Use "rex watch PACKAGE" command instead')
        if env.replay_log is not None:
            kwds.setdefault('extra_parameters', {})
            kwds['extra_parameters'].setdefault('replay_log', env.replay_log)
        return self.make(*args, **kwds)


class WatchTask(RexTask):
    """start watchers to rebuild generated files on source changes

    The `watch` task starts watchers to rebuild generated files on source
    changes
    """

    name = 'watch'

    def __call__(self):
        with self.make(initialize=False):
            package = get_packages()[0]
        if not isinstance(package, PythonPackage):
            raise fail("not a Python package: %s" % package.name)
        terminate = watch(package.name)
        if terminate is None:
            raise fail("nothing to watch")
        atexit.register(terminate)
        # Wait indefinitely but allow interruptions.
        while True:
            time.sleep(0.1)


class ServeTask(RexWatchTask):
    """start an HTTP server

    The `serve` task starts an HTTP server to serve a RexDB application.

    Use options `--host` and `--port` or settings `http-host` and `http-port`
    to specify the address and the port number for the HTTP server.
    If neither are set, the server is started on `127.0.0.1:8080`.

    Use option `--remote-user` to preset user credentials.  The value
    of this option is passed to the application as `REMOTE_USER` variable.

    By default, the server dumps HTTP logs in Apache Common Log Format
    to stdout.  Use option `--quiet` to suppress this output.  Unhandled
    application exceptions are dumped to stderr.

    Toggle `debug` setting to run the application in debug mode and report
    unhandled exceptions to the client.
    """

    name = 'serve'

    class options:
        host = option(
                'h', str, default=None,
                value_name="HOSTNAME",
                hint="bind to the specified host")
        port = option(
                'p', int, default=None,
                value_name="PORT",
                hint="bind to the specified port")
        remote_user = option(
                None, str, default=None,
                value_name="USER",
                hint="preset user credentials")
        environ = option(
                None, StrVal(r'[0-9A-Za-z_-]+(=.*)?'),
                default=[], plural=True,
                value_name="PARAM=VALUE",
                hint="set a WSGI environment variable")
        quiet = option(
                'q', bool,
                hint="suppress HTTP logs")

    def __call__(self):
        app = self.make_with_watch()
        host = self.host or env.http_host
        port = self.port or env.http_port
        environ = {}
        if self.remote_user:
            environ['REMOTE_USER'] = self.remote_user
        for value in self.environ:
            if '=' in value:
                key, value = value.split('=', 1)
            else:
                key, value = value, True
            environ[key] = value
        processes = []
        try:
            with app:
                services = get_settings().services
            if services:
                cfg = {
                        'requirements': app.requirements,
                        'parameters': app.parameters }
                json_fd, json_path = tempfile.mkstemp(
                        prefix=app.requirements[0]+'-', suffix='.json')
                stream = os.fdopen(json_fd, 'w')
                json.dump(
                        cfg, stream,
                        indent=2, separators=(',', ': '), sort_keys=True)
                stream.close()
                executable = 'rex'
                if hasattr(sys, 'real_prefix'):
                    executable = os.path.join(sys.prefix, 'bin', executable)
                executable += ' --config=' + json_path
                for service in services:
                    if not self.quiet:
                        log("Starting `{}`", service)
                    process = subprocess.Popen(
                            executable + ' ' + service, shell=True)
                    processes.append(process)
            if not self.quiet:
                log("Serving `{}` on `{}:{}`",
                    app.requirements[0], host, port)
            httpd = wsgiref.simple_server.make_server(
                    host, port, app,
                    RexServer.make(environ, self.quiet),
                    RexRequestHandler)
            httpd.serve_forever()
        finally:
            for process in processes:
                process.terminate()
            for process in processes:
                process.wait()


class WSGITask(RexTask):
    """generate a WSGI script

    The `wsgi` task generates a WSGI script for a RexDB application, which
    could be used with `uwsgi`, `mod_wsgi` or any other WSGI container.

    Use option `--output` to specify where to write the generated script.
    """

    name = 'wsgi'

    class options:
        output = option(
                'o', str, default=None,
                value_name="FILE",
                hint="write the script to a file")

    def __call__(self):
        # Build the application; validate requirements and configuration.
        app = self.make(initialize=False)
        with app:
            get_packages()
            get_settings()
        # Generate the script.
        stream = sys.stdout
        if self.output not in [None, '-']:
            stream = open(self.output, 'w')
        for line in wsgi_file(app):
            stream.write(line)


class ServeUWSGITask(RexWatchTask):
    """start a uWSGI server

    The `serve-uwsgi` task starts a RexDB application with a uWSGI server.

    Use option `--set-uwsgi` or setting `uwsgi` to specify configuration
    of the uWSGI server.
    """

    name = 'serve-uwsgi'

    class options:
        set_uwsgi = option(
                None, StrVal(r'[0-9A-Za-z_-]+(=.*)?'),
                default=[], plural=True,
                value_name="PARAM=VALUE",
                hint="set a uWSGI option")

    def __call__(self):
        # Build the application; validate requirements and configuration.
        app = self.make_with_watch(initialize=False)
        with app:
            services = get_settings().services
        # Make a temporary .wsgi file: /tmp/<project>-XXX.wsgi.
        wsgi_fd, wsgi_path = tempfile.mkstemp(
                prefix=app.requirements[0]+'-', suffix='.wsgi')
        # Make a temporary config file: /tmp/<project>-XXX.json.
        json_fd, json_path = tempfile.mkstemp(
                prefix=app.requirements[0]+'-', suffix='.json')
        # Write the .wsgi file.
        stream = os.fdopen(wsgi_fd, 'w')
        for line in wsgi_file(app):
            stream.write(line)
        stream.close()
        # Load parameters to uWSGI and generate `uwsgi` command line.
        if not env.uwsgi and not self.set_uwsgi:
            raise fail("missing uWSGI configuration")
        uwsgi_parameters = {}
        uwsgi_parameters['master'] = True
        uwsgi_parameters['need-app'] = True
        uwsgi_parameters['enable-threads'] = True
        uwsgi_parameters['plugin'] = 'python'
        if hasattr(sys, 'real_prefix'):
            uwsgi_parameters['virtualenv'] = sys.prefix
        uwsgi_parameters.update(env.uwsgi)
        for value in self.set_uwsgi:
            if '=' in value:
                key, value = value.split('=', 1)
            else:
                key, value = value, True
            uwsgi_parameters[key] = value
        uwsgi_parameters['wsgi-file'] = wsgi_path
        if services:
            executable = 'rex'
            if hasattr(sys, 'real_prefix'):
                executable = os.path.join(sys.prefix, 'bin', executable)
            executable += ' --config=' + json_path
            uwsgi_parameters['attach-daemon'] = [
                    executable + ' ' + service
                    for service in services]
        cfg = {
                'requirements': app.requirements,
                'parameters': app.parameters,
                'uwsgi': uwsgi_parameters }
        # Write the config.
        stream = os.fdopen(json_fd, 'w')
        json.dump(
                cfg, stream,
                indent=2, separators=(',', ': '), sort_keys=True)
        stream.close()
        # Start uWSGI.
        cmd = ['uwsgi', json_path]
        log("Starting uWSGI server for `{}`", app.requirements[0])
        exe(cmd)


class DaemonAttributes(object):
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
        self.json_path = os.path.join(self.run_dir, self.handle+'.json')
        self.pid_path = os.path.join(self.run_dir, self.handle+'.pid')
        self.log_path = os.path.join(self.run_dir, self.handle+'.log')
        self.wsgi_path = os.path.join(self.run_dir, self.handle+'.wsgi')


class StartTask(RexWatchTask):
    """start a uWSGI server in daemon mode

    The `start` task starts a RexDB application under a uWSGI server
    running in daemon mode.

    Use option `--set-uwsgi` or setting `uwsgi` to specify configuration
    of the uWSGI server.
    """

    name = 'start'

    class options:
        set_uwsgi = option(
                None, StrVal(r'[0-9A-Za-z_-]+(=.*)?'),
                default=[], plural=True,
                value_name="PARAM=VALUE",
                hint="set a uWSGI option")

    def __call__(self):
        # Build the application; validate requirements and configuration.
        app = self.make_with_watch()
        with app:
            services = get_settings().services
        form = DaemonAttributes(app)
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
        uwsgi_cfg['enable-threads'] = True
        if hasattr(sys, 'real_prefix'):
            uwsgi_cfg['virtualenv'] = sys.prefix
        uwsgi_cfg.update(env.uwsgi)
        for value in self.set_uwsgi:
            if '=' in value:
                key, value = value.split('=', 1)
            else:
                key, value = value, True
            uwsgi_cfg[key] = value
        uwsgi_cfg['wsgi-file'] = form.wsgi_path
        uwsgi_cfg['logto'] = form.log_path
        uwsgi_cfg['daemonize2'] = form.log_path
        uwsgi_cfg['pidfile'] = form.pid_path
        uwsgi_cfg['master'] = True
        if services:
            executable = 'rex'
            if hasattr(sys, 'real_prefix'):
                executable = os.path.join(sys.prefix, 'bin', executable)
            executable += ' --config=' + form.json_path
            uwsgi_cfg['attach-daemon'] = [
                    executable + ' ' + service
                    for service in services]
        sockets = ["%s: %s" % (key, value)
                   for key, value in sorted(uwsgi_cfg.items())
                   if key == 'socket' or key.endswith('-socket')]
        if not sockets:
            raise fail("uWSGI sockets are not configured")
        cfg = {
                'requirements': app.requirements,
                'parameters': app.parameters,
                'uwsgi': uwsgi_cfg }
        with open(form.json_path, 'w') as stream:
            json.dump(
                    cfg, stream,
                    indent=2, separators=(',', ': '), sort_keys=True)
        # Make a .wsgi script.
        with open(form.wsgi_path, 'w') as stream:
            for line in wsgi_file(app):
                stream.write(line)
        if os.path.exists(form.log_path):
            os.unlink(form.log_path)
        # Start uWSGI; catch errors if any.
        status = ", ".join(sockets+["logto: "+form.log_path])
        log("Starting `{}` ({})", form.name, status)
        cmd = ['uwsgi', form.json_path]
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


class StopTask(RexTask):
    """stop a running uWSGI daemon

    The `stop` task stops a uWSGI server running in daemon mode.
    """

    name = 'stop'

    def __call__(self):
        # Get the application properties.
        app = self.make(initialize=False)
        form = DaemonAttributes(app)
        # Get the daemon configuration and PID.
        uwsgi_cfg = {}
        pid = None
        if os.path.exists(form.json_path):
            try:
                cfg = json.load(open(form.json_path))
            except ValueError:
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


class StatusTask(RexTask):
    """check if a uWSGI daemon is running

    The `status` task verifies if there is an active UWSGI server
    running in daemon model.

    Use option `--pid` to print the process ID of the uWSGI daemon.

    Use option `--log` to print the name of the file with uWSGI logs.
    """

    name = 'status'

    class options:
        pid = option(
                None, BoolVal(),
                hint="print the daemon PID")
        log = option(
                None, BoolVal(),
                hint="print path to the log file")

    def __call__(self):
        # Get the application properties.
        app = self.make(initialize=False)
        form = DaemonAttributes(app)
        # Get the daemon configuration and PID.
        uwsgi_cfg = {}
        pid = None
        if os.path.exists(form.json_path):
            try:
                cfg = json.load(open(form.json_path))
            except ValueError:
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


class ReplayHandler(object):

    def __init__(self, app):
        self.app = app
        self.status = None
        self.headers = None
        self.body = None
        self.code = None
        self.host = None
        self.user = None
        self.date = None
        self.method = None
        self.query = None
        self.protocol = None
        self.size = None
        self.started = None
        self.finished = None
        self.elapsed = datetime.timedelta()
        self.total = 0
        self.errors = 0

    def reset(self, environ):
        self.status = None
        self.headers = None
        self.body = io.StringIO()
        self.code = None
        self.host = environ.get('REMOTE_HOST', environ.get('REMOTE_ADDR'))
        self.user = environ.get('REMOTE_USER') or '-'
        self.method = environ['REQUEST_METHOD']
        self.query = environ.get('PATH_INFO', '')
        if environ.get('QUERY_STRING'):
            self.query += '?' + environ['QUERY_STRING']
        self.protocol = environ.get('SERVER_PROTOCOL') or '-'
        self.size = None
        self.started = datetime.datetime.now()
        self.finished = None

    def start_response(self, status, headers, exc_info=None):
        self.status = status
        self.headers = headers
        return self.body.write

    def close(self):
        if self.status:
            self.code = self.status.split()[0]
        self.size = len(self.body.getvalue())
        self.finished = datetime.datetime.now()
        self.elapsed += self.finished - self.started
        self.total += 1
        self.errors += self.code >= '400'

    def __call__(self, environ):
        self.reset(environ)
        try:
            chunks = self.app(environ, self.start_response)
            for chunk in chunks:
                self.body.write(chunk)
        except:
            self.status = "500 Internal Server Error"
        self.close()

    def log(self):
        benchmark = (self.finished - self.started).total_seconds()
        benchmark = int(1 + math.log(benchmark))
        benchmark = min(max(benchmark, 0), 5)
        from cogs.log import COLORS
        COLORS.styles['benchmark'] = []
        if benchmark > 0:
            COLORS.styles['benchmark'] = [48, 5, 17 + 36*benchmark]
        if self.code < '400':
            line = "{} - {} [:benchmark:`{}`] \"`{} {} {}`\" {} {}"
        else:
            line = "{} - {} [:benchmark:`{}`] \"`{} {} {}`\" :warning:`{}` {}"
        log(line,
            self.host,
            self.user,
            self.finished - self.started,
            self.method,
            self.query,
            self.protocol,
            self.code,
            self.size)
        del COLORS.styles['benchmark']

    def summary(self):
        log("---")
        log("TIME ELAPSED: {}", self.elapsed)
        log("REQUESTS: {}", self.total)
        if self.errors:
            log("ERRORS: :warning:`{}`", self.errors)


class ReplayTask(RexTask):
    """replay WSGI requests from the log"""

    name = 'replay'

    class options:
        quiet = option('q', bool, hint="suppress output")
        profile = option(None, str, default=None,
                value_name="FILE",
                hint="write profile information")

    def __call__(self):
        # Open the replay log.
        app = self.make(initialize=False)
        with app:
            replay_log = get_settings().replay_log or env.replay_log
        if not replay_log:
            raise fail("replay log is not configured")
        if not os.path.exists(replay_log):
            raise fail("replay log does not exist: {}", replay_log)
        replay_log = open(replay_log)
        # Run the logs.
        if self.profile is not None:
            profile = cProfile.Profile()
        app = self.make(extra_parameters={'replay_log': None})
        handler = ReplayHandler(app)
        while True:
            try:
                environ = marshal.load(replay_log)
            except EOFError:
                break
            wsgi_input = environ.get('wsgi.input')
            if isinstance(wsgi_input, str):
                environ['wsgi.input'] = io.StringIO(wsgi_input)
            if self.profile is not None:
                profile.enable()
            handler(environ)
            if self.profile is not None:
                profile.disable()
            if not self.quiet:
                handler.log()
        if self.profile is not None:
            profile.dump_stats(self.profile)
        handler.summary()


class DeploymentTopic(Topic):
    """how to run a RexDB application on a web server

    The easiest way to start a RexDB application is to use the built-in
    development web server.  You can do it with `rex serve` task:

        $ rex serve rex.ctl_demo
        Serving rex.ctl_demo on localhost:8080

    This starts a development HTTP server with the `rex.ctl_demo`
    application.  Press Ctrl-C to stop the server.

    You can use options `--host` and `--port` to override the address
    of the HTTP server:

        $ rex serve rex.ctl_demo --host localhost --port 8088
        Serving rex.ctl_demo on localhost:8088

    Alternatively, the address of the development HTTP server could be
    configured using `http-host` and `http-port` global options:

        $ export REX_HTTP_HOST=localhost
        $ export REX_HTTP_PORT=8088

        $ rex serve rex.ctl_demo
        Serving rex.ctl_demo on localhost:8088

    When testing a RexDB application, it's often convenient to preset
    user credentials from the command line.  You can do it using option
    `--remote-user` with `rex serve` task:

        $ rex serve rex.ctl_demo --remote-user=Alice

    The built-in HTTP server is not well suited for running a RexDB
    application in production.  Fortunately, RexDB applications follow
    WSGI standard so you can run them with any WSGI server such as
    mod_wsgi, uWSGI or Gunicorn.

    To run an application on a WSGI server, we need to create a WSGI
    script, a small Python program that creates and configures a WSGI
    application object.  For that purpose, we can use `rex wsgi` task:

        $ rex wsgi rex.ctl_demo -o ctl_demo.wsgi

    This command generates a WSGI script for the `rex.ctl_demo` application
    and saves it as `ctl_demo.wsgi`.  You can now use it with any WSGI
    server to run the application.  For example, if you use uWSGI
    server, you can run:

        $ uwsgi_python --http-socket=:8080 --wsgi-file=./ctl_demo.wsgi

    A more complete uWSGI configuration may use the uwsgi protocol with
    a proxy web server, or run several worker processes and threads.
    You can save uWSGI configuration in `rex.yaml` file:

        uwsgi:
            processes: 4
            threads: 2
            socket: :3031

    Then you can manage the uWSGI server using `rex start`, `rex stop` and
    `rex status` tasks:

        $ rex start rex.ctl_demo
        Starting rex.ctl_demo (socket: :3031, logto: /run/rex/rex.ctl_demo.log)

        $ rex status rex.ctl_demo
        rex.ctl_demo is running (socket: :3031, logto: /run/rex/rex.ctl_demo.log)

        $ rex stop rex.ctl_demo
        Stopping rex.ctl_demo (socket: :3031, logto: /run/rex/rex.ctl_demo.log)

        $ rex status rex.ctl_demo
        rex.ctl_demo is not running
    """

    name = 'deployment'


