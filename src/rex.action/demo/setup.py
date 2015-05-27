from setuptools import setup, find_packages

setup(
    name='rex.wizard_demo',
    version = "0.1.0",
    description="Demo package for testing rex.wizard",
    install_requires=[
        'rex.wizard',
        'rex.deploy',
    ],
    rex_static='static'
)

