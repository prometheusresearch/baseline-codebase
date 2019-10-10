#
# Copyright (c) 2019, Prometheus Research, LLC
#

from setuptools import setup, find_packages


setup(
    name='codebase',
    version='0.0.0',
    description='Utilities for applications in a Codebase repository',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
)

