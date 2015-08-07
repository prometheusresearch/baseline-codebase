#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.about',
    version='0.1.1',
    description='A RexDB applet for displaying application versions and'
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
        'rex.applet>=2,<3',
        'rex.web>=2,<4',
        'rex.urlmap>=2,<3',
        'rex.widget>=1,<2',
    ],
    rex_init='rex.about',
    rex_static='static',
)

