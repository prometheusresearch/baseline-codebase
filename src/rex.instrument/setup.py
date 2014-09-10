#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.instrument',
    version='0.11.2',
    description='Class interfaces and framework for using EDC components',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.instrument-provisional',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    entry_points={
        'rex.ctl': [
            'instrument = rex.instrument.ctl',
        ],
    },
    setup_requires=[
        'rex.setup>=1.0,<2',
    ],
    install_requires=[
        'rex.core>=1.1,<2',
        'rex.ctl>=1,<2',
        'jsonschema>=2.3,<3',
        'rfc3987>=1.3.3,<2',
    ],
    rex_init='rex.instrument',
)

