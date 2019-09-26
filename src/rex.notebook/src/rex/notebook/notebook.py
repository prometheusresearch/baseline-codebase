# Do it before importing tornado.
from zmq.eventloop import ioloop

ioloop.install()

import contextlib

from tornado import httpserver, httputil, routing
from tornado.netutil import bind_unix_socket

from notebook.notebookapp import NotebookApp, NotebookWebApplication
from nbconvert import nbconvertapp
from nbconvert.preprocessors.execute import ExecutePreprocessor
from nbconvert import exporters as nbconvert_exporters
import nbstripout
import nbformat
import papermill

from rex.core import Error
from . import kernel


class NoAuthorization(httputil.HTTPMessageDelegate):
    def __init__(self, connection):
        self.connection = connection

    def finish(self):
        message = b"No authorization"
        message_len = str(len(message))
        self.connection.write_headers(
            httputil.ResponseStartLine("HTTP/1.1", 401, "Unauthorized"),
            httputil.HTTPHeaders(
                {"Content-Length": message_len, "Content-Type": "text/html"}
            ),
            message,
        )
        self.connection.finish()


class RexNotebookWebApplication(routing.Router):
    @classmethod
    def make_with_unix_socket(cls, unix_socket, **kwargs):
        return cls(port=None, host=None, unix_socket=unix_socket, **kwargs)

    @classmethod
    def make_with_host_port(cls, host, port, **kwargs):
        return cls(port=port, host=host, unix_socket=None, **kwargs)

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
                "default_url": base_url
                + self.settings.get("default_url", "tree"),
                "terminals_enabled": False,
                "kernel_spec_manager_class": kernel.KernelSpecManager,
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


def pre_save_hook(model, **kwargs):
    # Cleanup cell outputs and execution_count
    if model["type"] != "notebook":
        return
    node = nbformat.from_dict(model["content"])
    # Signature: strip_output(notebook, keep_output, keep_count)
    nbstripout.strip_output(node, False, False)
    model["content"] = node


class RexNotebookApp(NotebookApp):
    def __init__(self, *args, **kwargs):
        super(RexNotebookApp, self).__init__(*args, **kwargs)
        self.config.FileContentsManager.pre_save_hook = pre_save_hook

    def init_webapp(self):
        # skip this step as we don't want to init httpserver here
        pass


class RexNbConvertApp(nbconvertapp.NbConvertApp):
    def __init__(self, **settings):
        super(RexNbConvertApp, self).__init__(**settings)
        self.config["ExecutePreprocessor"].update(
            {"kernel_manager_class": kernel.KernelManager}
        )


def execute_notebook(
    input_file,
    output_file,
    format=None,
    exclude_input_prompt=False,
    exclude_output_prompt=False,
    exclude_input=False,
    parameters=None,
):
    """ Execute Jupyter notebook.

    Read Jupyter notebook from `input_file`, execute it, write output into
    `output_file` file-like object.

    If `format` is passed and is not `None` then the output will be formatted
    accordingly and written on disk in that form. Otherwise the output will be
    Jupyter notebook.
    """

    # Read input
    with openfile(input_file, "r") as ifp:
        nb = nbformat.read(ifp, 4)

    # Parametrize
    if parameters is not None:
        # Fixup nb for papermill
        nb.metadata["papermill"] = {}
        for cell in nb.cells:
            if not "tags" in cell.metadata:
                cell.metadata["tags"] = []
        nb = papermill.parameterize.parameterize_notebook(
            nb, parameters=parameters
        )

    # Execute
    preprocessor = ExecutePreprocessor(
        kernel_manager_class=kernel.KernelManager
    )
    preprocessor.preprocess(nb)

    # Write output
    if format is None:
        with openfile(output_file, 'w') as ofp:
            nbformat.write(nb, ofp)
    else:
        # Use custom formatter
        formats = nbconvert_exporters.get_export_names()
        if format not in formats:
            raise Error(
                f"Unknown format '{format}' specified, should be one of:",
                formats.join(", "),
            )
        exporter = nbconvert_exporters.get_exporter(format)
        out, _resources = nbconvert_exporters.export(
            exporter,
            nb,
            exclude_input_prompt=exclude_input_prompt,
            exclude_output_prompt=exclude_output_prompt,
            exclude_input=exclude_input,
        )
        with openfile(output_file, 'w') as ofp:
            ofp.write(out)


# Let papermill know how to inject parameters into rex notebooks.
papermill.translators.papermill_translators.register(
    "rex", papermill.translators.PythonTranslator
)


@contextlib.contextmanager
def openfile(file, mode):
    if isinstance(file, str):
        with open(file, mode) as fp:
            yield fp
    else:
        yield file
