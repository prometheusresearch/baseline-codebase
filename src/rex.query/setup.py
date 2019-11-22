#
# Copyright (c) 2016, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.query',
    version = "0.4.3",
    description="Compositional database query interface",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="Apache-2.0",
    url="https://bitbucket.org/rexdb/rex.query",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    entry_points={
        'htsql.addons': ['rex_query = htsql_rex_query:RexQueryAddon'],
    },
    install_requires=[
        'rex.core',
        'rex.db',
        'rex.deploy',
        'rex.web',
    ],
    rex_init='rex.query',
    rex_static='static',
)


