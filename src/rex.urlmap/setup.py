#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.urlmap',
    version = "2.8.0",
    description="Configures URL handlers",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.urlmap",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core >=1.9, <2',
        'rex.web >=3.6, <4',
        'rex.db >=3.0, <4',
        'rex.port >=1.0, <2',
    ],
    rex_init='rex.urlmap',
)


