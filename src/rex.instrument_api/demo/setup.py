#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.instrument_api_demo',
    version='0.2.1',
    description='Demo package for testing rex.instrument_api',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.deploy',
        'rex.demo.instrument',
        'rex.instrument_api',
    ],
    rex_init='rex.instrument_api_demo',
    rex_static='static',
)

