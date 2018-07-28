#
# Copyright (c) 2015, Prometheus Research, LLC
#

from setuptools import setup, find_packages

setup(
    name='rex.form_previewer',
    version='0.10.6',
    description='RexAcquire Form Previewer Applet',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.form_previewer',
    package_dir={'': 'src'},
    include_package_data=True,
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.setup',
        'rex.core',
        'rex.web',
        'rex.i18n',
        'rex.instrument',
        'rex.forms',
    ],
    rex_static='static',
    rex_init='rex.form_previewer',
)

