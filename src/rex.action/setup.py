#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#

from setuptools import setup, find_packages

setup(
    name='rex.action',
    version='1.7.0',
    description="Foundation of the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.action-provisional",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'werkzeug               >= 0.10.4, < 0.11',
        'inflect                >= 0.2.5,  < 0.3',
        'docutils               >= 0.12,   < 0.13',
        'rex.setup              >= 4,      < 5',
        'rex.core               >= 1.6,    < 2',
        'rex.widget             >= 3.0.1,  < 4',
        'rex.menu               >= 1.0,    < 2',
        'rex.db                 >= 3.4,    < 4',
        'rex.deploy             >= 2.4,    < 3',
    ],
    rex_init='rex.action',
    rex_static='static',
    rex_bundle={
        './www/doc': [
            'doc:html',
        ],
    })
