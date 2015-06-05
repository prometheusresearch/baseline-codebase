#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.restful_demo',
    version='0.4.1',
    description='Demo package for testing rex.restful',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.restful',
    ],
    rex_init='rex.restful_demo',
)

