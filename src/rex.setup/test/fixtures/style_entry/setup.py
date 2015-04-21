from setuptools import setup, find_packages

setup(
    name='pkg',
    version='0.0.0',
    package_dir={'': 'src'},
    packages=find_packages('src'),
    rex_static='static',
    rex_bundle={
        './www/bundle': [
            'webpack:',
        ],
    },
)

