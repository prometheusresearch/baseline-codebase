#
# Copyright (c) 2016, Prometheus Research, LLC
#

from setuptools import setup, find_packages

setup(
    name='rex.acquire_actions_demo',
    version='0.4.1',
    description='Demo package for testing rex.acquire_actions',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.acquire_actions',
        'rex.deploy',
        'rex.menu',
        'rex.widget_chrome',
        'rex.demo.instrument',
        'rex.demo.forms',
    ],
    rex_init='rex.acquire_actions_demo',
    rex_static='static',
)
