import json

# Do it before importing tornado.
from zmq.eventloop import ioloop

ioloop.install()

from tornado import httpserver
from tornado import routing

from notebook.notebookapp import NotebookApp, NotebookWebApplication
from . import kernel


class RexNotebookWebApplication(routing.Router):
    def __init__(self, port, host, settings):
        self.host = host
        self.port = port
        self.settings = settings
        self._app = None
        self._loop = ioloop.IOLoop.current()

    def find_handler(self, request, **kwargs):
        base_url = request.headers.get("X-Rex-Prefix-Path", "")
        if self._app is None:
            settings = {
                **self.settings,
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
