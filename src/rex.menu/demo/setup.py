
from setuptools import setup, find_packages
from distutils.core import Command

class demo(Command):

    description = "demonstrate menu configuration"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import os
        for cmd in ["rex deploy rex.menu_demo",
                    "rex serve rex.menu_demo"]:
            print "$", cmd
            os.spawnvp(0, cmd.split()[0], cmd.split())

setup(
    name='rex.menu_demo',
    version = "1.0.2",
    description="Demo package for testing rex.menu",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    install_requires=[
        'rex.menu',
        'rex.deploy',
        'rex.widget',
        'rex.action',
        'rex.widget_chrome',
    ],
    cmdclass={'demo': demo},
    rex_init='rex.menu_demo',
    rex_static='static',
)

