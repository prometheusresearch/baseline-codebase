#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.forms',
    version='2.4.3',
    description='Class interfaces and framework for using Instrument-based'
    ' Web Forms',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
        'License :: OSI Approved :: GNU Affero General Public License v3',
    ],
    url='https://bitbucket.org/rexdb/rex.forms',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    entry_points={
        'rex.ctl': [
            'forms = rex.forms.ctl',
        ],
    },
    install_requires=[
        'rex.core',
        'rex.ctl',
        'rex.db',
        'rex.web',
        'rex.instrument',
        'rex.expression',
        'rex.i18n',
        'rios.core>=0.7,<0.9',
    ],
    rex_init='rex.forms',
    rex_static='static'
)

