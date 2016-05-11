from setuptools import setup, find_packages

setup(
    name='dbgui_demo',
    version='4.0.0',
    description='Database management application / Demo',
    maintainer='Prometheus Research, LLC',
    license='AGPLv3',
    url='https://bitbucket.org/prometheus/dbgui',
    install_requires=[
        'dbgui'
    ],
    rex_static='static',
)

