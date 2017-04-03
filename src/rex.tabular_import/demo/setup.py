#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.tabular_import_demo',
    version='0.3.0',
    description='Demo package for testing rex.tabular_import',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.tabular_import',
    ],
    rex_init='rex.tabular_import_demo',
    rex_static='static',
)

