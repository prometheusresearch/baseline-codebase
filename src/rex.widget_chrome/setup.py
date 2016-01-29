#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.widget_chrome',
    version='0.1.0',
    description='Applet definition for the RexDB platform',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.widget_chrome',
    package_dir={'': 'src'},
    include_package_data=True,
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core >=1.11, <2',
        'rex.urlmap >=2.7, <3',
        'rex.action >=0.8, <1',
        'rex.web >=3.6, <4',
        'rex.widget >=1.5, <3',
    ],
    rex_init='rex.widget_chrome',
    rex_static='static',
)
