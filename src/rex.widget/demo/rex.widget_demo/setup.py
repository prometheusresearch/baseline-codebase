
from setuptools import setup, find_packages
from distutils.core import Command

class demo(Command):

    description = "widget showcase"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import os
        for cmd in ["rex deploy rex.widget_demo",
                    "rex serve rex.widget_demo"]:
            print "$", cmd
            os.spawnvp(0, cmd.split()[0], cmd.split())

setup(
    name='rex.widget_demo',
    version = "1.0.0",
    description="Demo package for testing rex.widget",
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.widget',
        'rex.urlmap',
        'rex.deploy',
    ],
    cmdclass={'demo': demo},
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:rex-widget-demo'
        ],
    }
)

