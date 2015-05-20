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
    install_requires=[
        'docutils-react-docgen  >= 0.1.0, < 0.2',
        'rex.expression         >= 1.3,   < 2',
        'rex.core               >= 1.6,   < 2',
        'rex.web                >= 3.0,   < 4',
        'rex.urlmap             >= 2.5,   < 3',
        'docutils               >= 0.12,  < 0.13',
        'simplejson             >= 3.0,   < 4',
        'jsonpublish            >= 0.2.1, < 0.3',
        'transit-python         == 0.8.250',
        'cached-property        >= 1,     < 2',
        'docutils               >= 0.12,  < 0.13',
    ],
    rex_init='rex.widget',
    rex_static='static',
)


