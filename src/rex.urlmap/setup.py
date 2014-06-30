#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.urlmap',
    version = "2.2.1",
    description="Configures URL handlers",
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
        'rex.core >=1.5, <2',
        'rex.web >=2.2, <3',
        'rex.db >=2.1, <3',
        'rex.port >=0.1.0',
    ],
    rex_init='rex.urlmap',
)


