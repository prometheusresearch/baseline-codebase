from setuptools import setup, find_packages

setup(
    name='rex.platform',
    version='4.0.0',
    description='RexDB Capstone Project',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rexdb.platform',
    include_package_data=True,
    setup_requires=[
        'rex.setup==2.0.1',
    ],
    install_requires=[ 
        'HTSQL==2.3.3.20150130',
        'HTSQL-PGSQL==2.3.3.20150130',
        'COGS==0.4.0',
        'rex.applet==0.0.1',
        'rex.core==1.10.0',
        'rex.ctl==2.0.0',
        'rex.db==3.1.0',
        'rex.deploy==2.1.0',
        'rex.expression==1.4.0',
        'rex.forms==0.27.0',
        'rex.i18n==0.4.0',
        'rex.instrument==0.13.0',
        'rex.port==1.0.3',
        'rex.restful==0.3.0',
#        'rex.sendmail==1.0.2',
        'rex.urlmap==2.6.0',
        'rex.web==3.2.0',
        'rex.widget==0.2.9',
    ],
)

