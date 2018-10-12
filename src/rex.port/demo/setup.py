
from setuptools import setup
from distutils.core import Command

class demo(Command):

    description = "demonstrate port operations"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import os
        cmd = "rex deploy rex.port_demo"
        print("$", cmd)
        os.spawnvp(0, cmd.split()[0], cmd.split())
        from rex.core import Rex
        demo = Rex('rex.port_demo')
        demo.on()
        from rex.port import Port
        print('-'*72)
        study_port = Port('study')
        print(study_port)
        from webob import Request
        req = Request.blank('/')
        print('-'*72)
        print(study_port(req))

setup(
    name='rex.port_demo',
    version = "1.3.2",
    description="Demo package for testing rex.port",
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.port',
        'rex.ctl',
        'rex.deploy',
    ],
    cmdclass={'demo': demo},
    rex_static='static',
)

