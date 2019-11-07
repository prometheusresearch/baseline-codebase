#
# Copyright (c) 2017, Prometheus Research, LLC
#

from setuptools import setup, find_packages


setup(
    name='rex.job',
    version='0.2.0',
    description='A user-oriented background job management tool.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='Apache-2.0',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.job',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'rex.db',
        'rex.deploy',
        'rex.asynctask',
        'rex.logging',
    ],
    rex_init='rex.job',
    rex_static='static',
)

