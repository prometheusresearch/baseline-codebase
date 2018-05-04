#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.i18n_demo',
    version='0.5.5',
    description='Demo package for testing rex.i18n',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.i18n',
        'honcho',
    ],
    rex_init='rex.i18n_demo',
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:rex-i18n-demo',
        ],
    },
)

