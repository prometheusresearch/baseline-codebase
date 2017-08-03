#
# Copyright (c) 2017, Prometheus Research, LLC
#


from setuptools import setup


setup(
    name='rex.baseline',
    version='1.1.0',
    description='Baseline for RexDB applications',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.baseline',
    include_package_data=True,
    install_requires=[
        'rex.platform == 6.2.2',
        'rex.query >= 0.3.1, < 2',
        'rex.asynctask >= 0.5.0, < 2',
    ],
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:rex-baseline'
        ]
    }
)

