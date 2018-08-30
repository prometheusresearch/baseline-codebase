
from setuptools import setup, find_packages
from distutils.core import Command

class demo(Command):

    description = "show how to use a custom rex command"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import os
        cmd = "rex deploy rex.ctl_demo"
        print("$", cmd)
        os.spawnvp(0, cmd.split()[0], cmd.split())
        cmd = "rex demo-user-list rex.ctl_demo"
        print("$", cmd)
        os.spawnvp(0, cmd.split()[0], cmd.split())

setup(
    name='rex.ctl_demo',
    version = "2.3.0",
    # Do not write `Summary` field to `PKG-INFO` file (for coverage testing):
    #description="Demo package for testing rex.ctl",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.deploy',
        'rex.port',
    ],
    entry_points={'rex.ctl': ['rex = rex.ctl_demo']},
    cmdclass={'demo': demo},
    rex_init='rex.ctl_demo',
    rex_static='static',
)

