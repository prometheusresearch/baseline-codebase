#
# Copyright (c) 2014, Prometheus Research, LLC
#

from setuptools import setup, find_packages

setup(
    name='rex.widget',
    version='3.1.1',
    description="Widget toolkit for the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="Apache-2.0",
    url="https://bitbucket.org/rexdb/rex.widget",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.setup',
        'rex.core',
        'rex.port',
        'rex.web',
        'rex.db',
        'rex.file',
        'rex.urlmap',
        'rex.menu',
        'docutils>=0.12,<0.13',
        'transit-python==0.8.302',
        'cached-property>=1,<2',
        'docutils>=0.12,<0.13',
        'werkzeug>=0.10.4,<0.11',
        'docutils-react-docgen>=1.1.0,<2.0.0',
        'docutils-shell>=0.0.2,<1.0',
    ],
    rex_init='rex.widget',
    rex_static='static', )
