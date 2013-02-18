#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


from setuptools import setup


setup(
    name='rexsetup',
    version = "0.1.1",
    description="Distutils extension for the Rex platform",
    long_description=open('README', 'r').read(),
    packages=['rexsetup'],
    package_dir={'': 'src'},
    entry_points={
        'distutils.setup_keywords': [
            'rex_data = rexsetup:check_data',
            'rex_prefix = rexsetup:check_prefix',
            'rex_load = rexsetup:check_load',
        ],
        'distutils.commands': [
            'install_rex = rexsetup:install_rex',
            'develop_rex = rexsetup:develop_rex'],
        'egg_info.writers': [
            'rex_data.txt = rexsetup:write_data_txt',
            'rex_prefix.txt = rexsetup:write_prefix_txt',
            'rex_load.txt = rexsetup:write_load_txt',
        ],
    },
)


