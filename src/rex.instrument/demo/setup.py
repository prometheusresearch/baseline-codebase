#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.instrument_demo',
    version='1.7.0',
    description='Demo package for testing rex.instrument',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'rex.db',
        'rex.ctl',
        'rex.deploy>=2.7,<3',
        'rex.instrument',
    ],
    rex_init='rex.instrument_demo',
    rex_static='static',
)

