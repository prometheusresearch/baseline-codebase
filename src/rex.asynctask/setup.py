#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.asynctask',
    version='0.7.0',
    description='An extensible framework for submitting and consuming'
    ' asynchronous tasks.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.asynctask',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    entry_points={
        'rex.ctl': [
            'asynctask = rex.asynctask.ctl',
        ],
    },
    install_requires=[
        'rex.core>=1.14,<2',
        'rex.ctl>=2,<3',
        'rex.logging>=1.1,<2',
        'redis>=2.10,<2.11',
        'HTSQL>=2.3.3,<3',
        'psycopg2',
        'apscheduler>=3.3,<4',
        'filelock>=2.0.8,<2.1',
        'kombu>=4.1,<5',
    ],
    rex_init='rex.asynctask',
    rex_static='static',
)

