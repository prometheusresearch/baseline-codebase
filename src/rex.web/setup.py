#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.web',
    version="3.1.0",
    description="Web stack for the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.web",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup >=1.0, <3',
    ],
    install_requires=[
        'rex.core >=1.9, <2',
        'webob >=1.3.1, <1.4',
        'jinja2 >=2.7, <2.8',
        'pycrypto >=2.4',   # must use the version available on Ubuntu 12.04.
        'pbkdf2 >=1.3',     # FIXME: use PBKDF2 implementation from PyCrypto
                            # once we upgrade to PyCrypto >= 2.5.
    ],
    rex_init='rex.web',
)


