
from setuptools import setup, find_packages
from distutils.core import Command

class demo(Command):

    description = "demonstrate query operations"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import os
        cmd = "rex query-demo-populate rex.query_demo"
        print "$", cmd
        os.spawnvp(0, cmd.split()[0], cmd.split())
        from rex.core import Rex
        demo = Rex('rex.query_demo')
        demo.on()
        from rex.query import Query
        print '-'*72
        study_query = Query({"op": "navigate", "params": ["study"]})
        print study_query
        from webob import Request
        req = Request.blank('/')
        print '-'*72
        print study_query(req)

setup(
    name='rex.query_demo',
    version = "0.4.2",
    description="Demo package for testing rex.query",
    install_requires=[
        'rex.query',
        'rex.ctl',
        'rex.port',
    ],
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    cmdclass={'demo': demo},
    entry_points={'rex.ctl': ['rex.query_demo = rex.query_demo']},
    rex_static='static',
    rex_init='rex.query_demo',
    rex_bundle={'./www/bundle': ['webpack:']}
)

