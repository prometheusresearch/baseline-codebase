#
# Copyright (c) 2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.forms',
    version='0.11.2',
    description="RexForms client Javascript code & templates",
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/prometheus/rex.forms',
    include_package_data=True,
    setup_requires=[
        'rex.setup>=1,<2',
    ],
    install_requires=[
        'rex.web>=1,<3',
        'rex.vendor>=1.2,<2',
        'rex.expression>=1,<1.1'
    ],
    rex_static='static',
)

