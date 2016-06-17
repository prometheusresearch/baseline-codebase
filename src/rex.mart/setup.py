#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.mart',
    version='0.2.2',
    description='Core backend functionality for the RexMart suite of tools',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
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
        'rex.core>=1.12,<2',
        'rex.ctl>=2,<3',
        'rex.db>=3,<4',
        'rex.deploy>=2,<3',
        'rex.instrument>=1.3,<2',
        'rex.web>=3.4,<4',
        'rex.restful>=1.1,<2',
        'rios.core>=0.7,<0.9',
        'cachetools>=1,<2',
    ],
    rex_init='rex.mart',
    rex_static='static',
)

