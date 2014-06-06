#
# Copyright (c) 2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.instrument',
    version='0.1.8',
    description="Instrument/Assessment model",
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/prometheus/rex.instrument',
    packages=find_packages('src'),
    package_dir={'': 'src'},
    include_package_data=True,
    namespace_packages=['rex'],
    install_requires=[
        'rex.core>=1,<2',
        'rex.validate>=0.1.8,<2',
        'HTSQL>=2.3.3,<3',
        'simplejson',
    ],
)

