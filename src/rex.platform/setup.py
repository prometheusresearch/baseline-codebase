#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup


setup(
    name='rex.platform',
    version='5.1.1',
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
        'HTSQL==2.3.3.20160412',
        'HTSQL-PGSQL==2.3.3.20160412',
        'COGS==0.4.0',
        'rex.action==1.1.0',
        'rex.setup==3.1.4',
        'rex.core==1.12.1',
        'rex.ctl==2.1.1',
        'rex.db==3.4.1',
        'rex.deploy==2.5.0',
        'rex.expression==1.5.2',
        'rex.forms==1.5.0',
        'rex.i18n==0.4.5',
        'rex.instrument==1.4.0',
        'rex.logging==1.0.0',
        'rex.port==1.2.0',
        'rex.restful==1.1.0',
        'rex.urlmap==2.8.0',
        'rex.web==3.7.0',
        'rex.widget==2.5.1',
        'rex.widget_chrome==1.1.0',
        'rex.file==1.0.3',
    ],
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:'
        ]
    }
)

