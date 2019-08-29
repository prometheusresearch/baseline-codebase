import json

# Do it before importing tornado.
from zmq.eventloop import ioloop

ioloop.install()

from tornado import httpserver, httputil, routing
from tornado.netutil import bind_unix_socket

from notebook.notebookapp import NotebookApp, NotebookWebApplication
from . import kernel


class NoAuthorization(httputil.HTTPMessageDelegate):
    def __init__(self, connection):
        self.connection = connection

    def finish(self):
        message = b"No authorization"
        self.connection.write_headers(
            httputil.ResponseStartLine("HTTP/1.1", 200, "OK"),
            httputil.HTTPHeaders({"Content-Length": str(len(message))}),
            message,
        )
        self.connection.finish()


class RexNotebookWebApplication(routing.Router):
    def __init__(
        self, port, host, unix_socket, settings, user_allowed, remote_user=None
    ):
        if not isinstance(user_allowed, (list, tuple, set)):
            user_allowed = {user_allowed}
        else:
            user_allowed = set(user_allowed)

        self.host = host
        self.port = port
        self.unix_socket = unix_socket
        self.settings = settings
        self.user_allowed = user_allowed
        self.remote_user = remote_user
        self._app = None
        self._loop = ioloop.IOLoop.current()

    def find_handler(self, request, **kwargs):
        if self.remote_user is not None:
            remote_user = self.remote_user
        else:
            remote_user = request.headers.get("X-Remote-User", None)
        if remote_user is None:
            return NoAuthorization(request.connection)
        if remote_user not in self.user_allowed:
            return NoAuthorization(request.connection)

        base_url = request.headers.get("X-Script-Name", "")
        if not base_url.endswith("/"):
            base_url = base_url + "/"
        if self._app is None:
            settings = {
                **self.settings,
                "allow_remote_access": True,
                "base_url": base_url,
                "default_url": base_url + "tree",
                "terminals_enabled": False,
                "kernel_spec_manager_class": kernel.Manager,
            }
            app = RexNotebookApp(**settings)
            app.initialize(argv=[])
            app.web_app = NotebookWebApplication(
                app,
                app.kernel_manager,
                app.contents_manager,
                app.session_manager,
                app.kernel_spec_manager,
                app.config_manager,
                app.extra_services,
                app.log,
                app.base_url,
                app.default_url,
                app.tornado_settings,
                app.jinja_environment_options,
            )
            app.io_loop = self._loop
            self._app = app
        return self._app.web_app.find_handler(request, **kwargs)

    def start(self):
        server = httpserver.HTTPServer(self)
        if self.unix_socket is not None:
            sock = bind_unix_socket(self.unix_socket, mode=0o666)
            server.add_socket(sock)
        else:
            server.listen(self.port, self.host)
        try:
            self._loop.start()
        finally:
            if self._app is not None:
                self._app.cleanup_kernels()


class RexNotebookApp(NotebookApp):
    def init_webapp(self):
        # skip this step as we don't want to init httpserver here
        pass
