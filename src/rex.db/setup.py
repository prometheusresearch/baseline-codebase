#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.db',
    version = "3.7.0",
    description="Database access for the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="Apache-2.0",
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
        'rex.core',
        'rex.ctl',
        'rex.web',
        'HTSQL',
    ],
    dependency_links=[
        'https://dist.rexdb.org/packages/',
    ],
    rex_init='rex.db',
)


