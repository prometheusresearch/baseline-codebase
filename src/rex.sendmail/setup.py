#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.sendmail',
    version = "1.0.1",
    description="Sending emails",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.sendmail",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup >=1.0, <2',
    ],
    install_requires=[
        'rex.core >=1.2, <2',
        'rex.web >=1.1, <3',
    ],
    rex_init='rex.sendmail',
)


