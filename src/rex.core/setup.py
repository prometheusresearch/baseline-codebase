#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.core',
    version = "0.5.1",
    description="Core components of the Rex platform",
    long_description=open('README', 'r').read(),
    author="Prometheus Research, LLC",
    license="AGPLv3",
    url="http://bitbucket.org/prometheus/rex.core",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    entry_points={},
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.setup',
        'pyyaml',
    ],
    rex_init='rex.core',
)


