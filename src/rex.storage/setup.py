#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.storage',
    version = "0.1.0",
    description="Generic cloud storage for files",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'cloudstorage[amazon,google,local]>=0.9,<0.10',
    ],
    entry_points={
        'rex.ctl': [
            'storage = rex.storage.ctl'
        ],
    },
    rex_init='rex.storage',
)


