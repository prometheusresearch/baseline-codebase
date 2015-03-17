#
# Copyright (c) 2015, Prometheus Research, LLC
#


import os
import distutils.log
import setuptools


class develop_namespace(setuptools.Command):
    # Fixes lookup issues with namespace packages when a package is
    # installed in development mode.

    description = "fix lookup issues with namespace packages"

    def initialize_options(self):
        self.namespace_packages = self.distribution.namespace_packages or []

    def finalize_options(self):
        pass

    def run(self):
        for name in self.namespace_packages:
            develop = self.get_finalized_command("develop")
            pth_path = os.path.join(develop.install_dir, "nsdev-%s.pth" % name)
            if os.path.exists(pth_path):
                continue
            distutils.log.info("Creating %s", pth_path)
            with open(pth_path, 'w') as pth:
                pth.write("import pkg_resources;"
                          " pkg_resources.declare_namespace(%r)\n" % name)


# Patch `develop` command to call `develop_namespace`.
_install_for_development = \
        setuptools.command.develop.develop.install_for_development
def install_for_development(self):
    _install_for_development(self)
    self.run_command('develop_namespace')
setuptools.command.develop.develop.install_for_development = \
        install_for_development


