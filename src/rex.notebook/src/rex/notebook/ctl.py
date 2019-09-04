"""

    rex.notebook.ctl
    ================

    :copyright: 2019-present Prometheus Research, LLC

"""

import sys
import os

from rex.ctl import RexTask, option, argument, log
from rex.core import Error, Setting, get_settings
from rex.core import StrVal, IntVal, RecordVal
from rex.db import get_db

from .kernel import Kernel
from .notebook import RexNotebookWebApplication

__all__ = ()


class RexNotebookSetting(Setting):
    """ Settings for rex.notebook.
    """

    validate = RecordVal(
        ("notebook_dir", StrVal(), None),
        ("port", IntVal(), None),
        ("host", StrVal(), None),
        ("unix_socket", StrVal(), None),
    )
    name = "rex_notebook"
    default = validate.record_type(
        notebook_dir=None, port=None, host=None, unix_socket=None
    )


class NotebookKernel(RexTask):
    """ Start Jupyter notebook."""

    name = "notebook-kernel"

    class arguments:
        name = argument()

    class options:
        connection_file = option(
            None, str, default="", value_name="FILE", hint="connection file"
        )

    def __call__(self):
        with self.make():
            kernel_cls = Kernel.mapped().get(self.name)
            if kernel_cls is None:
                raise Error("Unknown jupyter kernel:", self.name)
            kernel = kernel_cls()
            kernel.start(self.connection_file)


class Notebook(RexTask):
    """ Start Jupyter notebook."""

    name = "notebook"

    class arguments:
        user = argument()

    class options:
        port = option(
            "p",
            int,
            default=None,
            value_name="PORT",
            hint="bind to the specified port",
        )
        host = option(
            None,
            int,
            default=None,
            value_name="HOST",
            hint="bind to the specified host",
        )
        unix_socket = option(
            None,
            str,
            default=None,
            value_name="PATH",
            hint="bind to a socket at the specified path",
        )
        notebook_dir = option(
            "D",
            str,
            default=None,
            value_name="PATH",
            hint="directory to store notebooks in",
        )
        remote_user = option(
            None,
            str,
            default=None,
            value_name="REMOTE_USER",
            hint="Specify REMOTE_USER (only for testing)",
        )

    def __call__(self):
        rex = self.make(initialize=False)
        with rex:
            settings = get_settings().rex_notebook

            # notebook_dir
            notebook_dir = self.notebook_dir or settings.notebook_dir
            cwd = os.getcwd()
            if notebook_dir is None:
                notebook_dir = os.path.join(cwd, "notebooks")
            if not os.path.exists(notebook_dir):
                os.makedirs(notebook_dir)

            port = self.port or settings.port or 8080
            host = self.host or settings.host or "127.0.0.1"
            unix_socket = self.unix_socket or settings.unix_socket

            app = RexNotebookWebApplication(
                port=port,
                host=host,
                unix_socket=unix_socket,
                settings=dict(
                    notebook_dir=notebook_dir,
                    open_browser=False,
                    token="",
                    password="",
                ),
                user_allowed=self.user,
                remote_user=self.remote_user,
            )
            if unix_socket:
                log("Rex Notebook is listening on `{}`", unix_socket)
            else:
                log("Rex Notebook is listening on `{}:{}`", host, port)
            app.start()
