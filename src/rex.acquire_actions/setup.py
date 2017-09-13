#
# Copyright (c) 2016, Prometheus Research, LLC
#

from setuptools import setup, find_packages

setup(
    name='rex.acquire_actions',
    version='0.4.0',
    description='A collection of RexAction actions and wizards for RexAcquire'
    'workflows.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.acquire_actions',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    install_requires=[
        'rex.core>=1.4,<2',
        'rex.web>=3,<4',
        'rex.widget>=3,<4',
        'rex.action>=1,<2',
        'rex.instrument>=1,<2',
        'rex.forms>=2.1,<3',
    ],
    rex_init='rex.acquire_actions',
    rex_static='static', )
