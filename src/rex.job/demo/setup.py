#
# Copyright (c) 2017, Prometheus Research, LLC
#

from setuptools import setup, find_packages


setup(
    name='rex.job_demo',
    version='0.2.0',
    description='Demo package for testing rex.job',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.deploy',
        'rex.job',
        'rex.action',
        'rex.menu',
        'rex.widget_chrome',
    ],
    rex_init='rex.job_demo',
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:'
        ]
    },
)

