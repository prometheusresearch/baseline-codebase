#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.widget',
    version="0.1.3",
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
        'simplejson >= 3.0',
        'jquery-unparam >=1.0, <2',
        'pyquerystring >= 0.3.0, < 0.4.0'
    ],
    rex_init='rex.widget',
    rex_static='static',
)


