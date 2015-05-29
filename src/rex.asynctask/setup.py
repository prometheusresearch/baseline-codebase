#
# Copyright (c) 2015, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.asynctask',
    version='0.1.0',
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
    setup_requires=[
        'rex.setup>=1,<3',
    ],
    install_requires=[
        'rex.core>=1.4,<2',
        'rex.ctl>=2,<3',
        'rex.logging>=0.1,<0.2',
        'redis>=2.10,<2.11',
        'psycopg2',
    ],
    rex_init='rex.asynctask',
)

