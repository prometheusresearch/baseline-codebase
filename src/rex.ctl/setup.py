#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.ctl',
    version = "1.0.0",
    description="Command-line administration utility for the Rex platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
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
            'common = rex.ctl.common',
            'serve = rex.ctl.serve',
        ],
    },
    install_requires=[
        'rex.core >= 1.0, <2',
        'cogs',
    ],
)


