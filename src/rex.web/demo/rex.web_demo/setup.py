
from setuptools import setup, find_packages

setup(
    name='rex.web_demo',
    version = "1.0.0",
    description="Demo package for testing rex.web",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.web',
    ],
    rex_init='rex.web_demo',
    rex_static='static',
)

