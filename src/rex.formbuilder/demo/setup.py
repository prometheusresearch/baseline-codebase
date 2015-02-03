from setuptools import setup, find_packages

setup(
    name='rex.form_builder_demo',
    version = "4.0.0",
    description="Demo package for testing rex.formbuilder",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    include_package_data=True,
    namespace_packages=['rex'],
    setup_requires=[
        'rex.setup',
    ],
    install_requires=[
        'rex.deploy',
        'rex.study >=4.0, <4.1',
        'rex.formbuilder',
        'fake-factory>=0.4.0,<0.5',
    ],
    rex_static='static',
    rex_init='rex.form_builder_demo',
    rex_bundle={
        './www/bundle': [
            'webpack:rex-form-builder-demo'
        ]
    }
)
