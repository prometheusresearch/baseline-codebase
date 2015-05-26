from setuptools import setup, find_packages

setup(
    name='rex.wizard_demo',
    version = "0.1.0",
    description="Demo package for testing rex.wizard",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.wizard'
    ],
    rex_init='rex.wizard_demo',
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:rex-wizard-demo'
        ]
    },
)

