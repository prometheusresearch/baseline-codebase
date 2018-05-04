#
# Copyright (c) 2014, Prometheus Research, LLC
#

from setuptools import setup, find_packages


setup(
    name='rex.i18n',
    version='0.5.5',
    description='An Internationalization framework for rex.web applications.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
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
        'rex.setup>=3.2,<5',
        'rex.core>=1.9,<2',
        'rex.ctl>=2,<3',
        'rex.web>=3.1,<4',
        'babel>=2.3.4,<3',
        'speaklater>=1.3,<2',
        'pytz>=0a',
    ],
    rex_init='rex.i18n',
    rex_static='static',
)

