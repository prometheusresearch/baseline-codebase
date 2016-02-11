from setuptools import setup, find_packages

setup(
    name='rex.action_demo',
    version='0.9.0',
    description="Demo package for testing rex.action",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    install_requires=[
        'rex.action',
        'rex.deploy',
        'rex.widget_chrome >=0.1, <1',
    ],
    rex_init='rex.action_demo',
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:rex-action'
        ],
        './www/doc': [
            'doc:html',
        ],
    }
)
