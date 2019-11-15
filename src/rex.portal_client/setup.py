from setuptools import setup, find_packages

setup(
    name='rex.portal_client',
    version='0.7.0',
    description='Study configuration utilities',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    license='Apache-2.0',
    url='https://bitbucket.org/rexdb/rex.portal_client',
    package_dir={'': 'src'},
    include_package_data=True,
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.core',
        'requests >=2.12, <3',
    ],
    rex_init='rex.portal_client',
)
