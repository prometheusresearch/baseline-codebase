#
# Copyright (c) 2013, Prometheus Research, LLC
#


from cogs import env, setting, task, argument, option
from cogs.log import log
from .common import make_rex, pair
import sys
import binascii
import datetime
import traceback
import SocketServer
import wsgiref.simple_server, wsgiref.handlers, wsgiref.util


class RexServer(SocketServer.ThreadingMixIn, wsgiref.simple_server.WSGIServer):
    # HTTP server that spawns a thread for each request.

    # Whether to dump HTTP logs.
    quiet = False


class QuietRexServer(RexServer):
    # Displays unhandled tracebacks only.

    quiet = True


class RexRequestHandler(wsgiref.simple_server.WSGIRequestHandler):
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

        # Extract the remote user when Basic Auth is used.
        remote_user = '-'
        # Headers may not exist if the request failed to parse.
        auth = getattr(self, 'headers', {}).get('Authorization', '').split()
        if len(auth) == 2 and auth[0].lower() == 'basic':
            auth = auth[1]
            try:
                auth = auth.decode('base64')
            except binascii.Error:
                pass
            else:
                if ':' in auth:
                    remote_user = auth.split(':', 1)[0]

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
    # Customizes output for unhandled exceptions.

    def log_exception(self, exc_info):
        # Dumps the exception traceback to stderr.
        try:
            stderr = self.get_stderr()
            stderr.write("-"*70+"\n")
            for line in self.format_exception(exc_info):
                stderr.write(line)
            stderr.flush()
        finally:
            exc_info = None

    def error_output(self, environ, start_response):
        # Generates `500 Internal Server Error` page.  Includes the traceback
        # if `--debug` in enabled.
        exc_info = sys.exc_info()
        try:
            start_response(self.error_status, self.error_headers[:], exc_info)
            body = [self.error_body]
            if env.debug:
                body.append("\n\n")
                body.extend(self.format_exception(exc_info))
            return body
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


@setting
def HTTP_HOST(hostname=None):
    """HTTP server address

    The default address of the HTTP server.
    """
    if not hostname:
        hostname = '127.0.0.1'
    if not isinstance(hostname, str):
        raise ValueError("expected a host name or an IP address")
    env.http_host = hostname


@setting
def HTTP_PORT(port=None):
    """HTTP server port

    The default port number for the HTTP server.
    """
    if not port:
        port = 8080
    if isinstance(port, str):
        port = int(port)
    if not (isinstance(port, int) and 0 < port < 65536):
        raise ValueError("expected a port number")
    env.http_port = port


@task
class SERVE:
    """start an HTTP server

    The `serve` task starts an HTTP server to serve a RexDB application.

    This task takes one argument: the name of the primary RexDB package.
    Alternatively, the package could be specified using `project` setting.

    Use option `--require` or setting `requirements` to specify additional
    packages to include with the application.

    Use option `--set` or setting `parameters` to specify configuration
    parameters of the application.

    Use options `--host` and `--port` or settings `http-host` and `http-port`
    to specify the address and the port number for the HTTP server.
    If neither are set, the server is started on `127.0.0.1:8080`.

    By default, the server dumps HTTP logs in Apache Common Log Format
    to stdout.  Use option `--quiet` to suppress this output.  Unhandled
    application exceptions are dumped to stderr.

    Toggle `debug` setting to run the application in debug mode and report
    unhandled exceptions to the client.
    """

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")
    set = option(None, pair, default={}, plural=True,
            value_name="PARAM=VALUE",
            hint="set a configuration parameter")
    host = option('h', str, default=None,
            value_name="HOSTNAME",
            hint="bind to the specified host")
    port = option('p', int, default=None,
            value_name="PORT",
            hint="bind to the specified port")
    quiet = option('q', bool,
            hint="suppress HTTP logs")

    def __init__(self, project, require, set, host, port, quiet):
        self.project = project
        self.require = require
        self.set = set
        self.host = host
        self.port = port
        self.quiet = quiet

    def __call__(self):
        app = make_rex(self.project, self.require, self.set)
        host = self.host or env.http_host
        port = self.port or env.http_port
        if not self.quiet:
            if self.project or env.project:
                log("Serving `{}` on `{}:{}`",
                    self.project or env.project, host, port)
            else:
                log("Serving on `{}:{}`", host, port)
        httpd = wsgiref.simple_server.make_server(
                host, port, app,
                RexServer if not self.quiet else QuietRexServer,
                RexRequestHandler)
        httpd.serve_forever()


