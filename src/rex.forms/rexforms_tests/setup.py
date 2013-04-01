
from setuptools import setup, find_packages

setup(name='rexforms_tests',
      version="0.1.0",
      description="Tests for RexForms",
      setup_requires=['rexsetup'],
      packages=find_packages('src'),
      package_dir={'': 'src'},
      include_package_data=True,
      # namespace_packages=['rex'],
      install_requires=['rexrunner',
                        'rex.forms',
                        'rex.ext>=0.1.0',
                        'rex.instrument>=0.1.0',
                        'htsql>=2.3.3',
                        ],
      www_prefix='/rexforms_tests',
      www_dir='www',
      www_module='rexforms_tests',
      www_settings='settings.yaml',
      )
