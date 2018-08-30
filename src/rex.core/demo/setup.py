from setuptools import setup, find_packages
from distutils.core import Command


class demo(Command):

    description = "show how to get a list of packages and settings"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        from rex.core import Rex, get_packages, get_settings
        demo = Rex('rex.core_demo')
        print("demo:", demo)
        with demo:
            print("get_packages():", get_packages())
            print("get_settings():", get_settings())


setup(
    name='rex.core_demo',
    version="1.17.0",
    description="Demo package for testing rex.core",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.core',
    ],
    cmdclass={'demo': demo},
    rex_init='rex.core_demo',
    rex_static='static',
)

