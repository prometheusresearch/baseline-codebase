#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.deploy',
    version = "2.1.0",
    description="Database schema management for RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.deploy",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup >=1.0, <3',
    ],
    install_requires=[
        'rex.core >=1.2, <2',
        'rex.db >=2.0.1, <4',
        'rex.ctl >=2.0, <3',
        'HTSQL >=2.3.3, <2.5',
        'HTSQL-PGSQL >=2.3.3, <2.5',
        'psycopg2 >=2.4.2',
    ],
    entry_points = {
        'htsql.addons': ['rex_deploy = htsql_rex_deploy:DeployAddon'],
        'rex.ctl': ['rex.deploy = rex.deploy'],
    },
    rex_init='rex.deploy',
    rex_static='static',
)


