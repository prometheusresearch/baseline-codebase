#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.web',
    version="3.11.1",
    description="Web stack for the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.web",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'rex.ctl',
        'webob >=1.3.1, <1.4',
        'jinja2 >=2.7, <2.9',
        'pycrypto >=2.4',   # must use the version available on Ubuntu 12.04.
        'pbkdf2 >=1.3',     # FIXME: use PBKDF2 implementation from PyCrypto
                            # once we upgrade to PyCrypto >= 2.5.
    ],
    entry_points={'rex.ctl': ['rex.web = rex.web']},
    rex_init='rex.web',
    rex_static='static',
    rex_bundle={
        './static/www/ravenjs': [
            'https://cdn.ravenjs.com/3.12.1/raven.min.js#md5=6dcbcc3c7c6a7c5e8f6f4e94ec77dfd5',
        ],
    },
)


