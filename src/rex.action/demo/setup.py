from setuptools import setup, find_packages

setup(
    name='rex.workflow_demo',
    version = "0.1.0",
    description="Demo package for testing rex.workflow",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.workflow',
        'rex.study',
        'rex.study_demo',
    ],
    rex_init='rex.workflow_demo',
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:rex-workflow-demo'
        ]
    },
)

