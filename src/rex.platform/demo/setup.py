from setuptools import setup, find_packages

setup(
    name='rex.platform_demo',
    version='6.3.1',
    description="Demo package for testing rex.platform",
    include_package_data=True,
    install_requires=[
        'rex.platform',
    ],
    rex_static='static',
)
