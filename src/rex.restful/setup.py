#
# Copyright (c) 2013, Prometheus Research, LLC
#

from setuptools import setup, find_packages


setup(
    name='rex.restful',
    version='0.1.0',
    description='A framework for providing RESTful services in a RexDB app.',
    long_description=open('README.rst', 'r').read(),
    url='https://bitbucket.org/prometheus/rex.restful',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup>=1.0,<2',
    ],
    install_requires=[
        'rex.core>=1.0.0,<2',
        'rex.web>=1.1.0,<2',
        'Routes>=2.0',
    ],
    rex_init='rex.restful',
)

