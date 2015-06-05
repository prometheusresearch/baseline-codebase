#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.logging_demo',
    version='0.1.0',
    description='Demo package for testing rex.logging',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.logging',
    ],
    rex_init='rex.logging_demo',
    rex_static='static',
)

