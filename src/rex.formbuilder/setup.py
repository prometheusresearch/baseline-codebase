#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.formbuilder',
    version='5.2.0',
    description='A tool for creating and managing the Instruments and Forms in'
    ' a RexDB application.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.formbuilder-provisional',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup>=2,<3',
    ],
    install_requires=[
        'rex.core>=1.10,<2',
        'rex.web>=3.2,<4',
        'rex.instrument>=0.16,<0.17',
        'rex.forms>=0.30,<0.31',
        'rex.restful>=0.4,<0.5',
        'rex.applet>=0.2,<3',
        'rex.widget>=1,<2',
        'rex.i18n>=0.4,<0.5',
        'rex.form_previewer>=0.2,<0.5',
    ],
    rex_init='rex.formbuilder',
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:',
        ],
    },
)

