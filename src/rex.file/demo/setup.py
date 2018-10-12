
from setuptools import setup
from distutils.core import Command

class demo(Command):

    description = "demonstrate file attachments"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import os
        cmd = "rex deploy rex.file_demo"
        print("$", cmd)
        os.spawnvp(0, cmd.split()[0], cmd.split())

setup(
    name='rex.file_demo',
    version = "1.0.4",
    description="Demo package for testing rex.file",
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.file',
    ],
    cmdclass={'demo': demo},
    rex_static='static',
)

