#
# Copyright (c) 2017, Prometheus Research, LLC
#


from setuptools import setup


setup(
    name='rex.baseline',
    version='3.2.0',
    description='Baseline for RexDB applications',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.baseline',
    include_package_data=True,
    install_requires=[
        'rex.about',
        'rex.acquire_actions',
        'rex.action',
        'rex.assessment_import',
        'rex.asynctask',
        'rex.attach',
        'rex.core',
        'rex.ctl',
        'rex.db',
        'rex.dbgui',
        'rex.deploy',
        'rex.file',
        'rex.form_previewer',
        'rex.formbuilder',
        'rex.forms',
        'rex.i18n',
        'rex.instrument',
        'rex.job',
        'rex.logging',
        'rex.mart',
        'rex.mart_actions',
        'rex.menu',
        'rex.mobile',
        'rex.port',
        'rex.portal_client',
        'rex.query',
        'rex.restful',
        'rex.sendmail',
        'rex.setup',
        'rex.sms',
        'rex.tabular_import',
        'rex.urlmap',
        'rex.web',
        'rex.widget',
        'rex.widget_chrome',
    ],
    rex_static='static'
)

