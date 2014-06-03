#
# Copyright (c) 2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.formbuilder',
    version='2.0.0',
    description='A GUI for constructing RexAcquire Forms',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/prometheus/rex.formbuilder',
    packages=find_packages('src'),
    package_dir={'': 'src'},
    namespace_packages=['rex'],
    include_package_data=True,
    setup_requires=[
        'rex.setup>=1,<2',
    ],
    install_requires=[
        'rex.core>=1.6.0,<2',
        'rex.web>=2.1.1,<3',
        'rex.vendor>=1.5.1,<2',
        'HTSQL>=2.3.3,<3',
        'rex.forms>=0.11.1,<1',
        'rex.instrument>=0.1.7,<1',
        'rex.rdoma>=0.13.2,<2',
        'simplejson',
        'rex.application>=0.4.1,<1'
    ],
    rex_init='rex.formbuilder',
    rex_static='static',
)

