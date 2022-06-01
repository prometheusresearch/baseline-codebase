#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#

from setuptools import setup, find_packages

setup(
    name='rex.action',
    version='1.7.0',
    description="Foundation of the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="Apache-2.0",
    url="https://bitbucket.org/prometheus/rex.action-provisional",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.setup',
        'rex.core',
        'rex.widget',
        'rex.menu',
        'rex.db',
        'rex.deploy',
        'werkzeug>=0.10.4,<0.11',
        'inflect>=0.2.5,<0.3',
        'docutils>=0.12,<0.13',
        'protobuf==3.20.1',
    ],
    rex_init='rex.action',
    rex_static='static',
    rex_bundle={
        './www/doc': [
            'doc:html',
        ],
    })
