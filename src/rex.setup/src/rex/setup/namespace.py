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
        self.namespaces = []
        for package in self.distribution.namespace_packages or []:
            package = package.split('.')
            namespace = ()
            for name in package:
                namespace = namespace + (name,)
                if namespace not in self.namespaces:
                    self.namespaces.append(namespace)
        self.namespaces.sort()

    def finalize_options(self):
        pass

    def run(self):
        for namespace in self.namespaces:
            develop = self.get_finalized_command("develop")
            package_dir = os.path.join(develop.install_dir, *namespace)
            init_path = os.path.join(package_dir, '__init__.py')
            if os.path.exists(init_path):
                continue
            distutils.log.info("Creating %s", init_path)
            if not os.path.exists(package_dir):
                os.mkdir(package_dir)
            with open(init_path, 'w') as init:
                init.write("__import__('pkg_resources')"
                           ".declare_namespace(__name__)\n")


# Patch `develop` command to call `develop_namespace`.
_install_for_development = \
        setuptools.command.develop.develop.install_for_development
def install_for_development(self):
    _install_for_development(self)
    self.run_command('develop_namespace')
setuptools.command.develop.develop.install_for_development = \
        install_for_development


