#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.port',
    version = "1.0.2",
    description="Database querying and CRUD operations",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.port",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup >=1.0, <3',
    ],
    install_requires=[
        'rex.core >=1.6, <2',
        'rex.web >=2.1, <4',
        'rex.db >=2.1, <4',
    ],
    rex_init='rex.port',
    rex_static='static',
)


