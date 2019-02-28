#
# Copyright (c) 2014, Prometheus Research, LLC
#

from setuptools import setup, find_packages

setup(
    name='rex.formbuilder',
    version='5.9.3',
    description='A tool for creating and managing the Instruments and Forms in'
    ' a RexDB application.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.formbuilder-provisional',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'rex.web',
        'rex.instrument',
        'rex.forms',
        'rex.restful',
        'rex.widget',
        'rex.action',
        'rex.i18n',
        'rex.form_previewer',
    ],
    rex_init='rex.formbuilder',
    rex_static='static')
