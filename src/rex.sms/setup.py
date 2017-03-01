#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.sms',
    version='2.0.0',
    description='A RexDB interface for sending SMS text messages.',
    long_description=open('README.rst', 'r').read(),
    author='Prometheus Research, LLC',
    author_email='contact@prometheusresearch.com',
    license='AGPLv3',
    classifiers=[
        'Programming Language :: Python :: 2.7',
    ],
    url='https://bitbucket.org/rexdb/rex.sms',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    install_requires=[
        'rex.core>=1.9,<2',
        'rex.web>=1,<4',
        'rex.logging>=1,<2',
        'phonenumberslite>=7,<9',
        'twilio>=4,<6',
    ],
    rex_init='rex.sms',
)

