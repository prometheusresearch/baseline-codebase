#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.asynctask_demo',
    version='0.7.1',
    description='Demo package for testing rex.asynctask',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.deploy',
        'rex.asynctask',
        'pika',
    ],
    rex_init='rex.asynctask_demo',
    rex_static='static',
)

