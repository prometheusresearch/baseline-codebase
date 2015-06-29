#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.action',
    version="0.2.1",
    description="Foundation of the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.action-provisional",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'inflect',
        'docutils',

        'rex.core',
        'rex.widget',
        'rex.urlmap',
    ],
    rex_init='rex.action',
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:rex-action'
        ]
    }
)


