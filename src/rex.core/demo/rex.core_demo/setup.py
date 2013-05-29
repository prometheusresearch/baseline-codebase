
from setuptools import setup, find_packages

setup(
    name='rex.core_demo',
    version = "1.0.0",
    description="Demo package for testing rex.core",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.core',
    ],
    rex_init='rex.core_demo',
    rex_static='static',
)

