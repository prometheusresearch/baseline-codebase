"""

    rex.notebook.rex_kernel
    =======================

    Jupyter kernel with rex utilities.

    :copyright: 2019-present Prometheus Research, LLC

"""

import ipykernel.embed
import pandas as pd
import numpy as np

from htsql.core import domain

from .kernel import Kernel, KernelSpec

__all__ = ("RexKernel",)


class RexKernel(Kernel):
    name = "rex"

    # Kernel protocol

    @classmethod
    def spec(self):
        return KernelSpec(
            display_name="Rex", version="1.0.0", language="python"
        )

    # Implementation

    def cleanup(self):
        pass

    def start(self, connection_file):
        from . import v1

        db = v1.get_db()

        def produce(db, *args, **kwargs):
            return db.produce_df(*args, **kwargs)

        ns = {
            "db": v1.get_db(),
            "get_mart_by_definition": v1.get_mart_db,
            "produce": produce,
        }
        try:
            ipykernel.embed.embed_kernel(
                local_ns=ns, connection_file=connection_file
            )
        finally:
            self.cleanup()
