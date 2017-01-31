#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.about',
    version='0.4.0',
    description='A RexDB action for displaying application versions and'
    ' licensing information',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='http://bitbucket.org/rexdb/rex.about-provisional',
    package_dir={'':'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    install_requires=[
        'rex.web>=3,<4',
        'rex.widget>=1.5,<3',
        'rex.action>1,<2',
    ],
    rex_init='rex.about',
    rex_static='static',
)

