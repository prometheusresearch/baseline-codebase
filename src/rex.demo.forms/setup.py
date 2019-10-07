#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.demo.forms',
    version='2.5.0',
    description='Demo package for testing rex.forms',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'rex.db',
        'rex.ctl',
        'rex.deploy',
        'rex.web',
        'rex.forms',
        'rex.i18n',
        'rex.instrument',
        'rex.demo.instrument'
    ],
    rex_init='rex.demo.forms',
    rex_static='static',
)

