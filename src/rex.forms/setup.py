#
# Copyright (c) 2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.forms',
    version='0.10.0',
    description="RexForms client Javascript code & templates",
    include_package_data=True,
    setup_requires=['rex.setup'],
    install_requires=[
        'rex.web>=1.0,<2',
        'rex.common>=0.9',
        'rex.ext>=0.9',
    ],
    rex_static='static',
)

