#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.restful',
    version='0.2.0',
    description='A framework for providing RESTful services in a RexDB app.',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/prometheus/rex.restful',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup>=1,<2',
    ],
    install_requires=[
        'rex.core>=1,<2',
        'rex.web>=2,<3',
        'pyyaml',
    ],
    rex_init='rex.restful',
)

