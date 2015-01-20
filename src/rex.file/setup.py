#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.file',
    version = "1.0.0",
    description="Associating attachments with database records",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/rexdb/rex.file-provisional",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup >=1.0, <3',
    ],
    install_requires=[
        'rex.core >=1.9, <2',
        'rex.db >=3.0, <4',
        'rex.port >=1.0, <2',
        'rex.deploy >=1.6, <3',
        'rex.web >=3.1, <4',
        'rex.attach >=2.0, <3',
        'rex.urlmap >=2.6, <3',
    ],
    rex_init='rex.file',
    rex_static='static',
)


