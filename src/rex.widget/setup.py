#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.widget',
    version="1.0.0",
    description="Widget toolkit for the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/rexdb/rex.widget",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup >=1.2, <2',
    ],
    install_requires=[
        'rex.core >=1.6, <2',
        'rex.web >=3.0, <4',
    ],
    rex_init='rex.widget',
    rex_static='static',
)


