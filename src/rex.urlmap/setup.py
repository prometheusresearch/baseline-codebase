#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.urlmap',
    version = "1.0.0",
    description="Mapping HTTP requests to HTML templates",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.urlmap",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup >=1.0, <2',
    ],
    install_requires=[
        'rex.core >=1.0, <2',
        'rex.web >=1.1, <2',
    ],
    rex_init='rex.urlmap',
)


