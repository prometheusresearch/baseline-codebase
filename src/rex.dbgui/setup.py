from setuptools import setup, find_packages

setup(
    name='rex.dbgui',
    version='4.1.7',
    description='Database management application',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.dbgui',
    package_dir={'': 'src'},
    include_package_data=True,
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.db >=3.5, <4',
        'rex.deploy >=2.6, <3',
        'rex.web >=3.7, <4',
        'rex.widget >=3.0.1, <4',
        'rex.action >=1.1, <2',
    ],
    rex_init='rex.dbgui',
    rex_static='static',
    rex_bundle={'./www/bundle': ['webpack:rex-dbgui']})
