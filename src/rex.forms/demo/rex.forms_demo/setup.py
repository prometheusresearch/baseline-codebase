
from setuptools import setup, find_packages

setup(name='rex.forms_demo',
      version = "1.0.0",
      description="RexAcquire Demo",
      packages=find_packages('src'),
      package_dir={'': 'src'},
      include_package_data = True,
      namespace_packages=['rex'],

      rex_static='static',
      rex_init='rex.forms_demo',

      setup_requires=['rex.setup'],
      install_requires=[
          'rex.forms>=0.9.0',
          'rex.study_auth',
      ],
)
