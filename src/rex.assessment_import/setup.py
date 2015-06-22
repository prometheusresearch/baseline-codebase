from setuptools import setup, find_packages

setup(
    name='rex.assessment_import',
    version='0.1.0',
    description='Assessment Import Tools',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.assessment_import',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup >=1.0, <2',
        'rex.setup',    
    ],
    install_requires=[
       'rex.instrument', 
    ],
    rex_init='rex.assessment_import', 
    rex_static='static',
) 

