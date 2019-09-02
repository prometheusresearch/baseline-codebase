"""

    rex.notebook.rex_kernel
    =======================

    Juputer kernel with rex utilities.

    :copyright: 2019-present Prometheus Research, LLC

"""

import random
import string
import ipykernel.embed

from rex.db import get_db, RexHTSQL
from rex.deploy import get_cluster

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

    def __init__(self):
        super(RexKernel, self).__init__()
        self._databases_created = []

    def get_temp_db(self):
        """ Create an empty temporary database.

        The database will be dropped during kernel shutdown.
        """
        # TODO(andreypopp): allow different cluster for temp db, right now we
        # are reusing the cluster on which the main db resides.
        # Generate random db name
        randgen = random.SystemRandom()
        suffix = "".join(
            randgen.choice(string.ascii_uppercase + string.digits)
            for _ in range(6)
        )
        name = f"temp-db-{suffix}"
        # Create db
        cluster = get_cluster()
        cluster.create(name)
        self._databases_created.append(name)
        # Instantiate connection
        main_db = get_db()
        uri = main_db.htsql.db.clone(database=name)
        ext = {}
        ext.update({"rex_deploy": {}, "tweak.meta": {}})
        return RexHTSQL(uri, ext)

    def cleanup(self):
        cluster = get_cluster()
        for name in self._databases_created:
            cluster.drop(name)

    def start(self, connection_file):
        ns = {"db": get_db(), "get_temp_db": self.get_temp_db}
        try:
            ipykernel.embed.embed_kernel(
                local_ns=ns, connection_file=connection_file
            )
        finally:
            self.cleanup()
