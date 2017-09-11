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
    license='AGPLv3',
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
        'rex.core >=1.10, <2',
        'rex.ctl >=2, <3',
        'rex.db >=3, <4',
        'rex.deploy >=2.3.3, <3',
        'rex.job >=0.1, <0.2',
        'rex.attach >=2.0.4, <3',
        'rex.file >=1.0.4, <2',
        'rex.widget >=3, <4',
        'tablib >=0.10, <0.11',
    ],
    rex_init='rex.tabular_import',
    rex_static='static', )
