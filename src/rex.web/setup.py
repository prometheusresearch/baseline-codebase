#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.web',
    version = "0.5.1",
    description="Web stack for the Rex platform",
    long_description=open('README', 'r').read(),
    author="Prometheus Research, LLC",
    license="AGPLv3",
    url="http://bitbucket.org/prometheus/rex.web",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    entry_points={},
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.core',
        'webob',
    ],
    rex_init='rex.web',
)


