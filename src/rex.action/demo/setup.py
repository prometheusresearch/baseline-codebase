from setuptools import setup, find_packages

setup(
    name='rex.action_demo',
    version='0.6.0',
    description="Demo package for testing rex.action",
    install_requires=[
        'rex.action',
        'rex.deploy',
    ],
    rex_static='static'
)

