#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup


setup(
    name='rex.expression',
    version='1.5.3',
    description='JavaScript library to parse HTSQL-like expressions',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.expression-provisional',
    include_package_data=True,
    install_requires=[
        'rex.web',
    ],
    rex_static='static',
)

