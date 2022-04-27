#
# Copyright (c) 2014, Prometheus Research, LLC
#

from setuptools import setup, find_packages


setup(
    name='rex.i18n',
    version='0.5.6',
    description='An Internationalization framework for rex.web applications.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='Apache-2.0',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.i18n-provisional',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    entry_points={
        'rex.ctl': [
            'i18n = rex.i18n.ctl',
        ],
    },
    install_requires=[
        'rex.setup',
        'rex.core',
        'rex.ctl',
        'rex.web',
        'babel==2.10.1',
        'speaklater>=1.3,<2',
        'pytz>=0a',
    ],
    rex_init='rex.i18n',
    rex_static='static',
)

