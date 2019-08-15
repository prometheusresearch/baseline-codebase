"""

    rex.notebook
    ============

    :copyright: 2019-present Prometheus Research, LLC

"""

from rex.ctl import RexTask, option, argument
from rex.core import Error
from rex.db import get_db

from .kernel import Kernel
from .notebook import RexNotebookWebApplication

__all__ = ()


class NotebookKernel(RexTask):
    """ Start Jupyter notebook."""

    name = "notebook-kernel"

    class arguments:
        name = argument()

    class options:
        connection_file = option(
            None,
            str,
            default="",
            value_name="FILE",
            hint="connection file",
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

    class options:
        port = option(
            "p",
            int,
            default=8080,
            value_name="PORT",
            hint="bind to the specified port",
        )
        host = option(
            None,
            int,
            default="127.0.0.1",
            value_name="HOST",
            hint="bind to the specified host",
        )
        unix_socket = option(
            None,
            str,
            default="",
            value_name="PATH",
            hint="bind to a socket at the specified path",
        )

    def __call__(self):
        rex = self.make(initialize=False)
        with rex:
            app = RexNotebookWebApplication(
                port=self.port,
                host=self.host,
                settings=dict(open_browser=False, token="", password=""),
            )
            app.start()
