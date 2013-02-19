#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.setup',
    version = "0.1.1",
    description="Distutils extension for the Rex platform",
    long_description=open('README', 'r').read(),
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    entry_points={
        'distutils.setup_keywords': [
            'rex_data = rex.setup:check_data',
            'rex_prefix = rex.setup:check_prefix',
            'rex_load = rex.setup:check_load',
        ],
        'distutils.commands': [
            'install_rex = rex.setup:install_rex',
            'develop_rex = rex.setup:develop_rex'],
        'egg_info.writers': [
            'rex_data.txt = rex.setup:write_data_txt',
            'rex_prefix.txt = rex.setup:write_prefix_txt',
            'rex_load.txt = rex.setup:write_load_txt',
        ],
    },
)


