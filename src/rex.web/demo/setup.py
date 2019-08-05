
from setuptools import setup, find_packages
from distutils.core import Command

class demo(Command):

    description = "show how to make a simple query"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        from rex.core import Rex
        from webob import Request
        demo = Rex('rex.web_demo')
        req = Request.blank('/hello')
        print("-"*70)
        print(req)
        print("-"*70)
        print(req.get_response(demo))

setup(
    name='rex.web_demo',
    version="4.0.0",
    description="Demo package for testing rex.web",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.web',
        'docutils',
    ],
    cmdclass={'demo': demo},
    rex_init='rex.web_demo',
    rex_static='static',
)

