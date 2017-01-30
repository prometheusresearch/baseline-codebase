#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.assessment_import_demo',
    version='0.5.2',
    description='Demo package for testing rex.assessment_import',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.assessment_import >=0.4',
        'rex.instrument_demo',
    ],
    rex_init='rex.assessment_import_demo',
    rex_static='static',
)

