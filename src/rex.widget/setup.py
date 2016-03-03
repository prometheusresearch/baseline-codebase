#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.widget',
    version='2.3.0',
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
        'docutils-react-docgen  >= 1.1.0, < 2.0.0',
        'docutils-shell         >= 0.0.2, < 1.0',
        'rex.expression         >= 1.3,   < 2',
        'rex.setup              >= 3.1,   < 4',
        'rex.core               >= 1.6,   < 2',
        'rex.port               >= 1.1,   < 2',
        'rex.web                >= 3.0,   < 4',
        'rex.db                 >= 3.0,   < 4',
        'rex.file               >= 1.0,   < 2',
        'rex.urlmap             >= 2.5,   < 3',
        'docutils               >= 0.12,  < 0.13',
        'transit-python         == 0.8.250',
        'cached-property        >= 1,     < 2',
        'docutils               >= 0.12,  < 0.13',
        'werkzeug               >= 0.10.4, < 0.11',
    ],
    rex_init='rex.widget',
    rex_static='static',
)


