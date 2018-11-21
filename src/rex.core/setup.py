#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#

from setuptools import setup, find_packages

setup(
    name='rex.core',
    version="1.18.0",
    description="Foundation of the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.core",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex', 'sphinxcontrib'],
    install_requires=[
        'rex.setup',
        'raven>=6.0,<7',
        'python-dateutil>=2.5,<3',
        'pyyaml',
    ],
    rex_init='rex.core',
)

