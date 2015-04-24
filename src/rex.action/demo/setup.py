from setuptools import setup, find_packages

setup(
    name='rex.workflow_demo',
    version = "1.11.0",
    description="Demo package for testing rex.workflow",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.workflow',
    ],
    rex_init='rex.workflow_demo',
    rex_static='static',
)

