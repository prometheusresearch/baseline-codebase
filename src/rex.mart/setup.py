#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.mart',
    version='0.10.0',
    description='Core backend functionality for the RexMart suite of tools',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='Apache-2.0',
    url='https://bitbucket.org/rexdb/rex.mart-provisional',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    entry_points={
        'rex.ctl': [
            'mart = rex.mart.ctl',
        ],
    },
    install_requires=[
        'rex.core',
        'rex.ctl',
        'rex.db',
        'rex.deploy',
        'rex.port',
        'rex.instrument',
        'rex.forms',
        'rex.mobile',
        'rex.web',
        'rex.restful',
        'rex.asynctask',
        'rex.job',
        'rios.core>=0.7,<0.9',
        'cachetools>=1,<4',
    ],
    rex_init='rex.mart',
    rex_static='static',
)

