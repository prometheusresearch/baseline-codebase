#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.restful',
    version='1.4.0',
    description='A framework for providing RESTful services in a RexDB app.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
        'License :: OSI Approved :: GNU Affero General Public License v3',
    ],
    url='https://bitbucket.org/rexdb/rex.restful',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'rex.web',
        'rex.logging',
        'pyyaml',
        'python-dateutil',
    ],
    rex_init='rex.restful',
    rex_static='static',
)

