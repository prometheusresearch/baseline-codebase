from setuptools import setup, find_packages

setup(
    name='rex.dbgui',
    version='4.2.0',
    description='Database management application',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    license='Apache-2.0',
    url='https://bitbucket.org/rexdb/rex.dbgui',
    package_dir={'': 'src'},
    include_package_data=True,
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.db',
        'rex.deploy',
        'rex.web',
        'rex.widget',
        'rex.action',
    ],
    rex_init='rex.dbgui',
    rex_static='static',
)
