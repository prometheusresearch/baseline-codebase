#
# Copyright (c) 2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.ctl',
    version = "3.0.0",
    description="Command-line administration utility for the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="Apache-2.0",
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
        'rex.core',
    ],
    rex_init='rex.ctl',
)


