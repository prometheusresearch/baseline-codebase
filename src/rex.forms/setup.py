
from setuptools import setup, find_packages

setup(name='rex.forms',
      version = "0.1.2",
      description="Your description here",
      setup_requires=['rexsetup'],
      # Uncomment next 2 lines if you are adding any python code
      packages=find_packages('src'),
      package_dir={'': 'src'},
      include_package_data = True,
      namespace_packages=['rex'],
      install_requires=['rexrunner', 
          'rex.common>=0.1.0',
          'rex.ext>=0.1.0',
      ],

      www_prefix='/rex.forms',
      www_dir='www',
      www_module='rex.forms',
      www_settings='settings.yaml',
)
