#
# Copyright (c) 2017, Prometheus Research, LLC
#


from setuptools import setup


setup(
    name='rex.baseline',
    version='1.3.0',
    description='Baseline for RexDB applications',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.baseline',
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
        'rex.query',
        'rex.asynctask',
    ],
    rex_static='static'
)
