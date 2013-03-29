#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.setup',
    version = "0.5.1",
    description="Distutils extension for the Rex platform",
    long_description=open('README', 'r').read(),
    author="Prometheus Research, LLC",
    license="AGPLv3",
    url="http://bitbucket.org/prometheus/rex.setup",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    entry_points={
        'distutils.setup_keywords': [
            'rex_static = rex.setup:check_static',
            'rex_prefix = rex.setup:check_prefix',
            'rex_init = rex.setup:check_init',
        ],
        'distutils.commands': [
            'install_rex = rex.setup:install_rex',
            'develop_rex = rex.setup:develop_rex'],
        'egg_info.writers': [
            'rex_static.txt = rex.setup:write_static_txt',
            'rex_prefix.txt = rex.setup:write_prefix_txt',
            'rex_init.txt = rex.setup:write_init_txt',
        ],
    },
)


