#
# Copyright (c) 2014, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.i18n',
    version='0.2.0',
    description='An Internationalization framework for rex.web applications.',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    maintainer_email='contact@prometheusresearch.com',
    license='AGPLv3',
    url='https://bitbucket.org/prometheus/rex.i18n',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    entry_points={
        'rex.ctl': [
            'i18n = rex.i18n.ctl',
        ],
    },
    setup_requires=[
        'rex.setup>=1.1,<2',
    ],
    install_requires=[
        'rex.core>=1.4,<2',
        'rex.ctl>=1,<2',
        'rex.web>=2,<3',
        'babel>=1,<2',
        'speaklater>=1.3,<2',
        'polib>=1.0.4,<2',
        'pytz>=0a',
    ],
    rex_init='rex.i18n',
    rex_static='static',
    rex_bundle={
        './cldr': [
            'http://unicode.org/Public/cldr/25/json.zip'
            '#md5=b9c226b76393abe0715f0f6c1063d736',
        ],
#        './www/i18n': [
#            'webpack:rex-i18n',
#        ],
    },
)

