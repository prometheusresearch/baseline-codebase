#
# Copyright (c) 2015, Prometheus Research, LLC
#

from setuptools import setup

setup(
    name='rex.platform',
    version='7.0.0',
    description='RexDB Core Platform Libraries',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.platform',
    include_package_data=True,
    install_requires=[
        'COGS==0.4.1',
        'htsql',
        'rex.action',
        'rex.setup',
        'rex.core',
        'rex.ctl',
        'rex.db',
        'rex.deploy',
        'rex.expression',
        'rex.forms',
        'rex.i18n',
        'rex.instrument',
        'rex.logging',
        'rex.port',
        'rex.restful',
        'rex.urlmap',
        'rex.web',
        'rex.menu',
        'rex.widget',
        'rex.widget_chrome',
        'rex.file',
        'rex.dbgui',
    ],
    rex_static='static',
    rex_bundle={'./www/bundle': ['webpack:']})
