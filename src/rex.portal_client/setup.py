from setuptools import setup, find_packages

setup(
    name='rex.portal_client',
    version='0.5.0',
    description='Study configuration utilities',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.portal_client',
    package_dir={'': 'src'},
    include_package_data=True,
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'requests >=2.12, <3',
        'rex.core >=1.17.0, <2',

        'pyOpenSSL >=17.5, <18',
        'cryptography >=2.1, <2.2',
    ],
    rex_init='rex.portal_client',
)
