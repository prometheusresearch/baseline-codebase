#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup


setup(
    name='rex.platform',
    version='4.1.0',
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
    setup_requires=[
        'rex.setup==2.1.0',
    ],
    install_requires=[
        'HTSQL==2.3.3.20150130',
        'HTSQL-PGSQL==2.3.3.20150130',
        'COGS==0.4.0',
        'rex.applet==0.0.1',
        'rex.core==1.10.0',
        'rex.ctl==2.0.0',
        'rex.db==3.1.0',
        'rex.deploy==2.2.0',
        'rex.expression==1.5.0',
        'rex.forms==0.28.0',
        'rex.i18n==0.4.1',
        'rex.instrument==0.14.0',
        'rex.port==1.0.3',
        'rex.restful==0.3.0',
        'rex.urlmap==2.6.0',
        'rex.web==3.3.0',
        'rex.widget==0.2.11',
    ],
)

