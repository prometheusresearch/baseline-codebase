from setuptools import setup, find_packages

setup(
    name='rex.portal_client_demo',
    version='0.6.0',
    description="Demo package for testing rex.portal_client",
    install_requires=[
        'requests-mock >=1.2, <2',
        'rex.portal_client',
    ],
)
