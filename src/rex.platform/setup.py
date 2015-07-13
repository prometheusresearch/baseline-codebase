#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup


setup(
    name='rex.platform',
    version='4.7.0',
    description='RexDB Capstone Project',
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
        'HTSQL==2.3.3.201507130',
        'HTSQL-PGSQL==2.3.3.20150713',
        'COGS==0.4.0',
        'rex.applet==2.0.1',
        'rex.setup==3.0.0',
        'rex.core==1.11.2',
        'rex.ctl==2.0.0',
        'rex.db==3.3.0',
        'rex.deploy==2.3.2',
        'rex.expression==1.5.2',
        'rex.forms==0.31.0',
        'rex.i18n==0.4.3',
        'rex.instrument==0.18.0',
        'rex.port==1.0.4',
        'rex.restful==0.4.1',
        'rex.urlmap==2.6.1',
        'rex.web==3.5.0',
        'rex.widget==1.0.3',
        'rex.action==0.3.0',
    ],
)

