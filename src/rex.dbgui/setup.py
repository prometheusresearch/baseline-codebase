from setuptools import setup, find_packages

setup(
    name='dbgui',
    version='4.0.0',
    description='Database management application',
    long_description=open('README.rst', 'r').read(),
    maintainer='Prometheus Research, LLC',
    license='AGPLv3',
    url='https://bitbucket.org/prometheus/dbgui',
    package_dir={'': 'src'},
    include_package_data=True,
    packages=find_packages('src'),
    install_requires=[
        'rex.platform >= 5.2.0',

        # list unversioned dependencies (pinned in rex.platform)
        'rex.widget',
        'rex.widget_chrome',
        'rex.action',
    ],
    rex_init='dbgui',
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:dbgui'
        ]
    }
)

