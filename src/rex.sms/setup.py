#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.sms',
    version='0.2.1',
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
    setup_requires=[
        'rex.setup>=1,<3',
    ],
    install_requires=[
        'rex.core>=1.9,<2',
        'rex.web>=1,<4',
        'phonenumberslite>=6.3,<7',
        'twilio>=3.6,<4',
    ],
    rex_init='rex.sms',
)

