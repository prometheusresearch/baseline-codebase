#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.deploy',
    version='2.11.2',
    description="Database schema management for RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.deploy",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'rex.db',
        'rex.ctl',
        'HTSQL',
        'psycopg2>=2.7,<2.8',
        'jinja2>=2.10,<2.11',
    ],
    dependency_links=[
        'https://dist.rexdb.org/packages/',
    ],
    entry_points = {
        'htsql.addons': ['rex_deploy = htsql_rex_deploy:DeployAddon'],
        'rex.ctl': ['rex.deploy = rex.deploy'],
    },
    rex_init='rex.deploy',
    rex_static='static',
)


