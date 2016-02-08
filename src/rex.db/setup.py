#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.db',
    version = "3.4.1",
    description="Database access for the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.db",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    entry_points={
        'htsql.addons': [
            'rex = htsql_rex:RexAddon',
        ],
        'rex.ctl': [
            'rex.db = rex.db',
        ],
    },
    install_requires=[
        'rex.core >=1.10, <2',
        'rex.ctl >=2.0, <3',
        'rex.web >=3.6, <4',
        'HTSQL >2.3.3, <2.5',
    ],
    dependency_links=[
        'https://bitbucket.org/rexdb/htsql-rexdb/downloads',
    ],
    rex_init='rex.db',
)


