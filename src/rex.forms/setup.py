#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.forms',
    version='0.26.0',
    description='Class interfaces and framework for using Instrument-based'
    ' Web Forms',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.forms-provisional',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    entry_points={
        'rex.ctl': [
            'forms = rex.forms.ctl',
        ],
    },
    setup_requires=[
        'rex.setup>=1.1,<2',
    ],
    install_requires=[
        'rex.core>=1.4,<2',
        'rex.ctl>=1,<2',
        'rex.instrument>=0.12,<2',
        'rex.expression>=1.3,<2',
        'rex.i18n>=0.3,<2',
        'jsonschema>=2.3,<3',
        'rfc3987>=1.3.3,<2'
    ],
    rex_init='rex.forms',
    rex_static='static'
)

