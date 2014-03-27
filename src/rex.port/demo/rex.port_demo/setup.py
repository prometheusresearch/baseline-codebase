
from setuptools import setup
from distutils.core import Command

class demo(Command):

    description = "demonstrate CRUD operations"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        pass

setup(
    name='rex.port_demo',
    version = "1.0.0",
    description="Demo package for testing rex.port",
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.port',
    ],
    cmdclass={'demo': demo},
)

