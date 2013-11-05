
from setuptools import setup
from distutils.core import Command

class demo(Command):

    description = "demonstrate URL mapping"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import os
        for cmd in ["rex deploy rex.urlmap_demo",
                    "rex serve rex.urlmap_demo"]:
            print "$", cmd
            os.spawnvp(0, cmd.split()[0], cmd.split())

setup(
    name='rex.urlmap_demo',
    version = "1.0.0",
    description="Demo package for testing rex.urlmap",
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.urlmap',
        'rex.vendor',
        'rex.deploy',
    ],
    cmdclass={'demo': demo},
    rex_static='static',
)

