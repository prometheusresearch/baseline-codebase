#
# Copyright (c) 2015, Prometheus Research, LLC
#

from setuptools import setup

setup(
    name='rex.platform',
    version='6.3.0',
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
        'HTSQL==2.3.3.20171027',
        'HTSQL-PGSQL==2.3.3.20171027',
        'COGS==0.4.1',
        'rex.action==1.7.0',
        'rex.setup==4.1.1',
        'rex.core==1.17.0',
        'rex.ctl==2.3.0',
        'rex.db==3.7.0',
        'rex.deploy==2.10.0',
        'rex.expression==1.5.2',
        'rex.forms==2.4.1',
        'rex.i18n==0.5.3',
        'rex.instrument==1.8.0',
        'rex.logging==1.1.0',
        'rex.port==1.3.1',
        'rex.restful==1.3.0',
        'rex.urlmap==2.8.0',
        'rex.web==3.11.1',
        'rex.menu==1.0.2',
        'rex.widget==3.1.0',
        'rex.widget_chrome==1.2.4',
        'rex.file==1.0.4',
        'rex.dbgui==4.1.7',
    ],
    rex_static='static',
    rex_bundle={'./www/bundle': ['webpack:']})
