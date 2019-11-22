#
# Copyright (c) 2016, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.menu',
    version = "1.0.2",
    description="Organizes a hierarchical catalog of application pages",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="Apache-2.0",
    url="https://bitbucket.org/prometheus/rex.menu",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'rex.web',
    ],
    rex_init='rex.menu',
)


