#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.formbuilder',
    version='4.1.1',
    description='The RexFormbuilder application, a tool for creating and'
    'managing the Instruments and Forms in the RexDB platform',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
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
        'rex.web>=3.2.0,<4',
        'rex.forms>=0.27.0,<2',
        'rex.restful>=0.3.0,<2',
        'rex.applet >0, <1',
        'rex.widget >0, <1',
        'rex.form_previewer >=0.1, <2',
        'docutils',
        'simplejson'
    ],
    rex_init='rex.formbuilder',
    rex_static='static'
)

