#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.asynctask',
    version='0.7.1',
    description='An extensible framework for submitting and consuming'
    ' asynchronous tasks.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
        'License :: OSI Approved :: GNU Affero General Public License v3',
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
        'rex.core',
        'rex.ctl',
        'rex.logging',
        'HTSQL',
        'redis>=3,<4',
        'psycopg2',
        'apscheduler>=3.3,<4',
        'ratelimiter>=1.2,<2',
        'filelock>=2.0.8,<4',
        'kombu>=4.1,<5',
    ],
    rex_init='rex.asynctask',
    rex_static='static',
)

