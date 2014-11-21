
from setuptools import setup, find_packages
from distutils.core import Command

class demo(Command):

    description = "show how to serve a Rex application"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import os
        cmd = "rex deploy rex.ctl_demo"
        print "$", cmd
        os.spawnvp(0, cmd.split()[0], cmd.split())
        cmd = "rex serve rex.ctl_demo --set hello_access=anybody"
        print "$", cmd
        os.spawnvp(0, cmd.split()[0], cmd.split())

setup(
    name='rex.ctl_demo',
    version = "1.5.0",
    # Do not write `Summary` field to `PKG-INFO` file (for coverage testing):
    #description="Demo package for testing rex.ctl",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.web',
        'rex.db',
        'rex.deploy',
    ],
    cmdclass={'demo': demo},
    rex_init='rex.ctl_demo',
    rex_static='static',
)

