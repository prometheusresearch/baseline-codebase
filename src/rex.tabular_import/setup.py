#
# Copyright (c) 2015, Prometheus Research, LLC
#

from setuptools import setup, find_packages

setup(
    name='rex.tabular_import',
    version='0.4.0',
    description='A tool for importing flat datafiles into RexDB tables.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='Apache-2.0',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.tabular_import-provisional',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    entry_points={
        'rex.ctl': [
            'tabular_import = rex.tabular_import.ctl',
        ],
    },
    install_requires=[
        'rex.core',
        'rex.ctl',
        'rex.db',
        'rex.deploy',
        'rex.attach',
        'rex.file',
        'rex.widget',
        'tablib >=0.12, <0.13',
    ],
    rex_init='rex.tabular_import')
