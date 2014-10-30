#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.formbuilder',
    version='3.0.1',
    description='The RexFormbuilder application, a tool for creating and'
    'managing the Instruments and Forms in the RexDB platform',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.formbuilder-provisional',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup>=1.1,<2',
    ],
    install_requires=[
        'rex.core>=1.4,<2',
        'rex.web>=2,<4',
        'rex.forms>=0.22.0,<2',
        'rex.restful>=0.2.1,<2',
        'rex.application>=1,<2',
    ],
    rex_bundle={
        './www/bundle': [
            'webpack:rex-formbuilder',
        ],
    },
    rex_init='rex.formbuilder',
    rex_static='static'
)

