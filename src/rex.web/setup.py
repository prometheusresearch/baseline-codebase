#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.web',
    version = "1.0.0",
    description="Web stack for the Rex platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="http://bitbucket.org/prometheus/rex.web",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup >=1.0, <2',
    ],
    install_requires=[
        'rex.core >=1.0, <2',
        'webob',
        'jinja2',
        'pycrypto',
        'pbkdf2',
    ],
    rex_init='rex.web',
)


