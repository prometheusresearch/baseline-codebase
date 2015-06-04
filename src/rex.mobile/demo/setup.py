#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.mobile_demo',
    version='0.1.0',
    description='Demo package for testing rex.mobile',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.core',
        'rex.db',
        'rex.ctl',
        'rex.deploy',
        'rex.mobile',
        'rex.instrument',
        'rex.instrument_demo',
        'rex.forms',
    ],
    rex_init='rex.mobile_demo',
    rex_static='static',
)

