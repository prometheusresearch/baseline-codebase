#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.port',
    version = "1.3.2",
    description="Database querying and CRUD operations",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.port",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'rex.ctl',
        'rex.web',
        'rex.db',
    ],
    entry_points = {
        'htsql.addons': ['rex_port = htsql_rex_port:PortAddon'],
    },
    rex_init='rex.port',
    rex_static='static',
)


