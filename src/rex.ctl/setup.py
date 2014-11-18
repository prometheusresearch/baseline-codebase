#
# Copyright (c) 2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.ctl',
    version = "1.5.0",
    description="Command-line administration utility for the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.ctl",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    entry_points={
        'console_scripts': [
            'rex = rex.ctl:main',
        ],
        'rex.ctl': [
            'rex = rex.ctl',
        ],
    },
    install_requires=[
        'rex.setup >=1.1, <2',
        'rex.core >=1.6, <2',
        'cogs >=0.3.0',
    ],
)


