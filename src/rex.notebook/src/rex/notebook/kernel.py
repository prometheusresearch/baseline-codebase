"""

    rex.notebook.kernel
    ===================

    Define jupyter kernels for Rex Notebook.

    :copyright: 2019-present Prometheus Research, LLC

"""

import json
import jupyter_client.kernelspec

from rex.core import get_rex, Extension

__all__ = ("Kernel", "KernelSpec")


KernelSpec = jupyter_client.kernelspec.KernelSpec


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
        raise NotImplementedError("Kernel.spec()")

    def start(self, connection_file):
        """ Start kernel given a `connection_file`.
        """
        raise NotImplementedError("Kernel.start()")


class Manager(jupyter_client.kernelspec.KernelSpecManager):
    def __init__(self, *args, **kwargs):
        super(Manager, self).__init__(*args, **kwargs)
        rex = get_rex()
        self.specs = {}
        for k in Kernel.all():
            info = k.spec().to_dict()
            spec = jupyter_client.kernelspec.KernelSpec(
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
            raise jupyter_client.kernelspec.NoSuchKernel(kernel_name)
        return kernel

    def find_kernel_specs(self):
        raise NotImplementedError()

    def install_kernel_spec(self, *args, **kwargs):
        raise NotImplementedError()
