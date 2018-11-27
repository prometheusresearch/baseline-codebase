#
# Copyright (c) 2017, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.about_demo',
    version='0.4.1',
    description='Demo package for testing rex.about',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.about',
        'rex.menu',
        'rex.widget_chrome',
    ],
    rex_init='rex.about_demo',
    rex_static='static',
)

