#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.ctl',
    version = "0.5.1",
    description="Command-line administration utility for the Rex platform",
    long_description=open('README', 'r').read(),
    author="Prometheus Research, LLC",
    license="AGPLv3",
    url="http://bitbucket.org/prometheus/rex.ctl",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    entry_points={
        'console_scripts': [
            'rex = rex.ctl:main',
        ],
        'rex.ctl': [
            'serve = rex.ctl.serve',
        ],
    },
    install_requires=[
        'rex.core',
        'Cogs',
    ],
)


