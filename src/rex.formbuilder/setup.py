#
# Copyright (c) 2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.formbuilder',
    version='1.2.1',
    description='A GUI for constructing RexAcquire Forms',
    entry_points={
        'rdoma.modules': ['rex_formbuilder = rex.formbuilder.deploy'],
    },
    setup_requires=['rex.setup'],
    packages=find_packages('src'),
    package_dir={'': 'src'},
    namespace_packages=['rex'],
    include_package_data=True,
    install_requires=[
        'rex.web>=1.0,<2',
        'htsql>=2.3.3',
        'rex.common>=0.9',
        'rex.ext>=0.9',
        'rex.forms>=0.10,<2',
        'rex.instrument>=0.1.5,<2',
    ],
    rex_init='rex.formbuilder',
    rex_static='static',
)

