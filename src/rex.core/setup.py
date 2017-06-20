#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#

from setuptools import setup, find_packages

setup(
    name='rex.core',
    version="1.16.1",
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
        'rex.setup >=1.0, <5',  # For use by `rex.core` descendants.
        'raven >=6.0, <7',
        'pyyaml',
    ],
    rex_init='rex.core',
)

