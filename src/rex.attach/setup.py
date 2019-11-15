#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.attach',
    version = "2.1.0",
    description="File storage for uploaded files",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="Apache-2.0",
    url="https://bitbucket.org/prometheus/rex.attach",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'rex.web',
        'boto3>=1.9,<1.10',
        'google-cloud-storage>=1.13,<1.14',
    ],
    rex_init='rex.attach',
    rex_static='static',
)


