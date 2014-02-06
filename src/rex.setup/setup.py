#
# Copyright (c) 2012-2013, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rex.setup',
    version = "1.0.2",
    description="Distutils extension for the RexDB platform",
    long_description=open('README.rst', 'r').read(),
    maintainer="Prometheus Research, LLC",
    maintainer_email="contact@prometheusresearch.com",
    license="AGPLv3",
    url="https://bitbucket.org/prometheus/rex.setup",
    package_dir={'': 'src'},
    packages=find_packages('src'),
    namespace_packages=['rex'],
    entry_points={
        'distutils.setup_keywords': [
            'rex_init = rex.setup:check_init',
            'rex_static = rex.setup:check_static',
            'rex_download = rex.setup:check_download',
        ],
        'distutils.commands': [
            'install_rex = rex.setup:install_rex',
            'develop_rex = rex.setup:develop_rex',
            'download_rex = rex.setup:download_rex',
        ],
        'egg_info.writers': [
            'rex_init.txt = rex.setup:write_init_txt',
            'rex_static.txt = rex.setup:write_static_txt',
        ],
    },
)


