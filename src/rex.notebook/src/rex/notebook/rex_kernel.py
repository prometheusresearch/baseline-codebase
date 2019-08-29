"""

    rex.notebook.rex_kernel
    =======================

    Juputer kernel with rex utilities.

    :copyright: 2019-present Prometheus Research, LLC

"""

import ipykernel.embed
from rex.db import get_db
from .kernel import Kernel, KernelSpec

__all__ = ("RexKernel",)


class RexKernel(Kernel):
    name = "rex"

    @classmethod
    def spec(self):
        return KernelSpec(
            display_name="Rex", version="1.0.0", language="python"
        )

    def start(self, connection_file):
        ns = {}
        ipykernel.embed.embed_kernel(
            local_ns={"db": get_db()}, connection_file=connection_file
        )
