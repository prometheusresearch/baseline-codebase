from setuptools import setup, find_packages
from distutils.core import Command

setup(
    name='rex.graphql_demo',
    version = "0.4.3",
    description="Demo package for testing rex.graphql",
    install_requires=[
        'rex.graphql',
        'rex.ctl',
    ],
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    entry_points={'rex.ctl': ['rex.graphql_demo = rex.graphql_demo']},
    rex_static='static',
    rex_init='rex.graphql_demo',
)

