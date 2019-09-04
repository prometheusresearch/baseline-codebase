#
# Copyright (c) 2018, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.demo.baseline',
    version='0.0.0',
    description='Demo baseline app for RexDB applications',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/baseline-codebase',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex', 'rex.demo'],
    include_package_data=True,
    install_requires=[
        'rex.baseline',
        'rex.notebook',
        'rex.storage',
    ],
    rex_static='static',
)

