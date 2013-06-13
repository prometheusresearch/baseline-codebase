
from setuptools import setup, find_packages

setup(
    name='rex.ctl_demo',
    version = "1.0.0",
    description="Demo package for testing rex.ctl",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.web',
    ],
    rex_init='rex.ctl_demo',
    rex_static='static',
)

