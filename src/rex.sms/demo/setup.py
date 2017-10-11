#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.sms_demo',
    version='2.0.1',
    description='Demo package for testing rex.sms',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.sms',
    ],
    rex_init='rex.sms_demo',
    rex_static='static',
)

