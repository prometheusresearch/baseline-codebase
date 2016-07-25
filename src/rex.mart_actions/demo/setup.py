#
# Copyright (c) 2016, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.mart_actions_demo',
    version='0.2.1',
    description='Demo package for testing rex.mart_actions',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.mart_actions',
        'rex.deploy',
        'rex.urlmap',
        'rex.widget_chrome',
    ],
    rex_init='rex.mart_actions_demo',
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:'
        ]
    }
)

