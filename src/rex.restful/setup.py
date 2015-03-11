#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.restful',
    version='0.3.1',
    description='A framework for providing RESTful services in a RexDB app.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.restful',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup>=1,<3',
    ],
    install_requires=[
        'rex.core>=1.9,<2',
        'rex.web>=2,<4',
        'pyyaml',
        'python-dateutil',
    ],
    rex_init='rex.restful',
)

