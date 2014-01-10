
from setuptools import setup, find_packages
from distutils.core import Command
import os

class demo(Command):

    description = "create a directory to store attachments"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        directory = './sandbox/attachments'
        if not os.path.exists(directory):
            os.makedirs(directory)
        print "Created attachment storage:"
        print "\t%s" % directory

setup(
    name='rex.attach_demo',
    version="1.0.0",
    description="Demo package for testing rex.attach",
    install_requires=[
        'rex.attach',
    ],
    cmdclass={'demo': demo},
)

