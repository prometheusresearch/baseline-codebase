#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.forms_demo',
    version='0.28.1',
    description='Demo package for testing rex.forms',
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
        'rex.web',
        'rex.forms',
        'rex.instrument',
        'rex.instrument_demo'
    ],
    rex_init='rex.forms_demo',
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:rex-forms-demo'
        ],
    },
)

