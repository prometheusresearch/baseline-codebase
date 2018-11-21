
from setuptools import setup, find_packages
from distutils.core import Command
import os

class demo(Command):

    description = "start file upload demo"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        attach_dir = '../sandbox/attachments'
        if not os.path.exists(attach_dir):
            os.makedirs(attach_dir)
            print("Created attachment storage:")
            print("\t%s" % attach_dir)
        cmd = "rex deploy rex.attach_demo"
        print("$", cmd)
        os.spawnvp(0, cmd.split()[0], cmd.split())
        cmd = "rex serve rex.attach_demo" \
                " --set attach_dir=%s" % attach_dir
        print("$", cmd)
        os.spawnvp(0, cmd.split()[0], cmd.split())

setup(
    name='rex.attach_demo',
    version="2.1.0",
    description="Demo package for testing rex.attach",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.attach',
        'rex.db',
        'rex.deploy',
    ],
    cmdclass={'demo': demo},
    rex_init='rex.attach_demo',
    rex_static='static',
)

