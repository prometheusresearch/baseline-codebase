#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.form_previewer',
    version='0.4.0',
    description='RexAcquire Form Previewer Applet',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.form_previewer',
    package_dir={'': 'src'},
    include_package_data=True,
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup>=2,<3',
    ],
    install_requires=[
        'rex.applet>=0.3,<3',
        'rex.core>=1.9,<2',
        'rex.web>=2,<4',
        'rex.i18n>=0.4,<0.5',
        'rex.instrument>=0.13,<0.17',
        'rex.forms>=0.28,<0.31',
    ],
    rex_static='static',
    rex_init='rex.form_previewer',
    rex_bundle={
        './www/bundle': [
            'webpack:rex-form-previewer',
        ],
    },
)

