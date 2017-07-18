#
# Copyright (c) 2016, Prometheus Research, LLC
#

from setuptools import setup, find_packages

setup(
    name='rex.acquire_actions_demo',
    version='0.3.0',
    description='Demo package for testing rex.acquire_actions',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.acquire_actions',
        'rex.deploy',
        'rex.menu',
        'rex.widget_chrome',
        'rex.instrument_demo',
        'rex.forms_demo',
    ],
    rex_init='rex.acquire_actions_demo',
    rex_static='static',
    rex_bundle={'./www/bundle': ['webpack:']})
