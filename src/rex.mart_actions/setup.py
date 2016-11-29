#
# Copyright (c) 2016, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.mart_actions',
    version='0.5.0',
    description='A collection of RexAction actions and wizards for exploring'
    'RexMart databases.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.mart_actions',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    install_requires=[
        'rex.core>=1.4,<2',
        'rex.web>=3,<4',
        'rex.widget>=2.3,<3',
        'rex.action>=1,<2',
        'rex.mart>=0.4,<0.5',
        'rex.query>=0.1,<0.3',
        'htsql_excel>=0.1,<0.2',
        'cachetools>=1,<2',
    ],
    rex_init='rex.mart_actions',
    rex_static='static',
)

