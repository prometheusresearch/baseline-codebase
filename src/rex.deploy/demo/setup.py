
from setuptools import setup
from distutils.core import Command

class demo(Command):

    description = "demonstrate schema deployment"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import os
        cmd = "rex deploy rex.deploy_demo"
        print("$", cmd)
        os.spawnvp(0, cmd.split()[0], cmd.split())

setup(
    name='rex.deploy_demo',
    version='2.11.2',
    description="Demo package for testing rex.deploy",
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.deploy',
        'rex.port',
    ],
    cmdclass={'demo': demo},
    rex_static='static',
)

