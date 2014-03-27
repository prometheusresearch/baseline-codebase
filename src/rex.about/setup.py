from setuptools import setup, find_packages

setup(
    name='rex.about',
    version='0.0.1',
    description='Licensing and dependent works declaration',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    license='AGPLv3',
    url='http://bitbucket.org/prometheus/rex.about-provisional',
    package_dir={'':'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    include_package_data=True,
    setup_requires=[
        'rex.setup>=1.0.2, <2',
    ],
    install_requires=[
        'rex.urlmap >= 1.0.1, <2',
        'rex.ui >=1.0.1, <2',
    ],
    rex_init='rex.about',
    rex_static='static',
)
