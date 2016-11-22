#
# Copyright (c) 2016, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.query',
    version = "0.1.0",
    description="Compositional database query interface",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/rexdb/rex.query",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    entry_points={
        'htsql.addons': ['rex_query = htsql_rex_query:RexQueryAddon'],
    },
    install_requires=[
        'rex.core >=1.13, <2',
        'rex.db >=3.5, <4',
        'rex.deploy >=2.8, <3',
        'rex.web >=3.7, <4',
    ],
    rex_init='rex.query',
    rex_static='static',
    rex_bundle={
        './www/bundle': ['js:'],
    }
)


