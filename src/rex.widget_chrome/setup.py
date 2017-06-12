#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#

from setuptools import setup, find_packages

setup(
    name='rex.widget_chrome',
    version='1.2.4',
    description='Applet definition for the RexDB platform',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.widget_chrome',
    package_dir={'': 'src'},
    include_package_data=True,
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core >=1.11, <2',
        'rex.urlmap >=2.7, <3',
        'rex.action >=1, <2',
        'rex.web >=3.6, <4',
        'rex.widget >=3, <4',
    ],
    rex_init='rex.widget_chrome',
    rex_static='static', )
