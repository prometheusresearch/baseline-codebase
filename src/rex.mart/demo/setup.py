#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.mart_demo',
    version='0.7.1',
    description='Demo package for testing rex.mart',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.deploy',
        'rex.mart',
        'rex.asynctask',
        'rex.instrument_demo',
        'rex.forms_demo',
        'rex.mobile_demo',
    ],
    rex_init='rex.mart_demo',
    rex_static='static',
)

