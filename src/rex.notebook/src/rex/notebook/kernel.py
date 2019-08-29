import json
import ipykernel.embed
from jupyter_client import kernelspec

from rex.core import get_rex, Extension, Setting
from rex.core import RecordVal, BoolVal
from rex.db import get_db


class Kernel(Extension):
    """ Define how to start a jupyter kernel.
    """

    name = NotImplemented

    # Extension protocol

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def enabled(cls):
        return cls.name is not NotImplemented

    # Kernel protocol

    @classmethod
    def spec(self):
        """ Return :class:`jupyter_client.kernelspec.KernelSpec` instance.
        """
        raise NotImplementedError("NotebookKernel.spec()")

    def start(self, connection_file):
        """ Start kernel given a `connection_file`.
        """
        raise NotImplementedError("NotebookKernel.start()")


class RexKernel(Kernel):
    name = "rex"

    @classmethod
    def spec(self):
        return kernelspec.KernelSpec(
            display_name="Rex", version="1.0.0", language="python"
        )

    def start(self, connection_file):
        ns = {}
        ipykernel.embed.embed_kernel(
            local_ns={"db": get_db()}, connection_file=connection_file
        )


class Manager(kernelspec.KernelSpecManager):
    def __init__(self, *args, **kwargs):
        super(Manager, self).__init__(*args, **kwargs)
        rex = get_rex()
        self.specs = {}
        for k in Kernel.all():
            info = k.spec().to_dict()
            spec = kernelspec.KernelSpec(
                display_name=info["display_name"],
                language=info["language"],
                argv=[
                    "rex",
                    "notebook-kernel",
                    "--connection-file",
                    "{connection_file}",
                    k.name,
                ],
                env={
                    **info["env"],
                    "REX_PROJECT": rex.requirements[0],
                    "REX_PARAMETERS": json.dumps(rex.parameters),
                },
            )
            self.specs[k.name] = spec

    def get_all_specs(self):
        return {
            # TODO: set resource_dir
            name: {"resource_dir": "./share", "spec": kernel.to_dict()}
            for name, kernel in self.specs.items()
        }

    def get_kernel_spec(self, kernel_name):
        kernel = self.specs.get(kernel_name)
        if kernel is None:
            raise kernelspec.NoSuchKernel(kernel_name)
        return kernel

    def find_kernel_specs(self):
        raise NotImplementedError()

    def install_kernel_spec(self, *args, **kwargs):
        raise NotImplementedError()
