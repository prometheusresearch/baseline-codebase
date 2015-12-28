#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.mobile',
    version='0.6.0',
    description='Class interfaces and framework for using Instrument-based'
    ' SMS Interactions',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.mobile',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    entry_points={
        'rex.ctl': [
            'mobile = rex.mobile.ctl',
        ],
    },
    install_requires=[
        'rex.core>=1.9,<2',
        'rex.ctl>=2,<3',
        'rex.instrument>=1,<2',
        'rios.core>=0.7,<0.8',
    ],
    rex_init='rex.mobile',
)

