#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.file',
    version = "1.0.4",
    description="Associating attachments with database records",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="Apache-2.0",
    url="https://bitbucket.org/rexdb/rex.file-provisional",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'rex.db',
        'rex.port',
        'rex.deploy',
        'rex.web',
        'rex.attach',
        'rex.urlmap',
    ],
    rex_init='rex.file',
)


