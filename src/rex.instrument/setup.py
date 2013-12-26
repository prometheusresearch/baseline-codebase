#
# Copyright (c) 2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.instrument',
    version='0.1.5',
    description="Instrument/Assessment model",
    packages=find_packages('src'),
    package_dir={'': 'src'},
    include_package_data=True,
    namespace_packages=['rex'],
    install_requires=[
        'rex.validate>=0.1.8,<2'
    ],
)

