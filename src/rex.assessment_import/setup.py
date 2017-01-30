from setuptools import setup, find_packages

setup(
    name='rex.assessment_import',
    version='0.5.2',
    description='Assessment Import Tools',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    license='AGPLv3',
    url='https://bitbucket.org/rexdb/rex.assessment_import',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
       'xlrd', # version?
       'xlwt', # version?
       'rex.instrument>=1.7,<2',
    ],
    entry_points={
        'rex.ctl': [
            'instrument = rex.assessment_import.ctl'
        ],
    },
    rex_init='rex.assessment_import',
    rex_static='static',
)

