#
# Copyright (c) 2016, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.menu',
    version = "1.0.0",
    description="Organizes a hierarchical catalog of application pages",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.menu",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core >=1.13, <2',
        'rex.web >=3.7, <4',
    ],
    rex_init='rex.menu',
)


