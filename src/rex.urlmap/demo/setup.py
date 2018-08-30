
from setuptools import setup, find_packages
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
            print("$", cmd)
            os.spawnvp(0, cmd.split()[0], cmd.split())

setup(
    name='rex.urlmap_demo',
    version = "2.8.0",
    description="Demo package for testing rex.urlmap",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.urlmap',
        'rex.deploy',
        'rex.ctl',
    ],
    cmdclass={'demo': demo},
    rex_init='rex.urlmap_demo',
    rex_static='static',
)

