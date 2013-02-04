#
# Copyright (c) 2012, Prometheus Research, LLC
#


from setuptools import setup, find_packages


setup(
    name='rexsetup',
    version='0.1.0',
    description="Installation package for the RexRunner platform",
    long_description=open('README', 'r').read(),
    packages=find_packages('src'),
    package_dir={'': 'src'},
    entry_points={
        'distutils.setup_keywords': [
            'www_dir = rexsetup:check_dir',
            'www_prefix = rexsetup:check_prefix',
            'www_module = rexsetup:check_module',
            'www_settings = rexsetup:check_file',
        ],
        'distutils.commands': [
            'install_www = rexsetup:install_www',
            'develop_www = rexsetup:develop_www'],
        'egg_info.writers': [
            'www.txt = rexsetup:write_www_txt',
        ],
      },
)
