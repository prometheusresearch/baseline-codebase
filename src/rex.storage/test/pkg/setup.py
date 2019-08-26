#
# Copyright (c) 2019, Prometheus Research, LLC
#

from setuptools import setup, find_packages


setup(
    name='rex.storage_test',
    version='0.0.0',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.storage',
    ],
    rex_init='rex.storage_test',
    rex_static='static',
)

