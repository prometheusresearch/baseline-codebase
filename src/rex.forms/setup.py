#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.forms',
    version='0.30.0',
    description='Class interfaces and framework for using Instrument-based'
    ' Web Forms',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.forms-provisional',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    entry_points={
        'rex.ctl': [
            'forms = rex.forms.ctl',
        ],
    },
    setup_requires=[
        'rex.setup>=1.1,<3',
    ],
    install_requires=[
        'rex.core>=1.9,<2',
        'rex.ctl>=2,<3',
        'rex.instrument>=0.16,<0.17',
        'rex.expression>=1.3,<2',
        'rex.i18n>=0.3,<0.5',
        'prismh.core>=0.1,<0.2',
    ],
    rex_init='rex.forms',
    rex_static='static'
)

