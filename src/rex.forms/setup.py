
from setuptools import setup, find_packages

setup(name='rex.forms',
      version="1.0.0",
      description="RexForms client Javascript code & templates",
      include_package_data=True,

      rex_static='static',

      setup_requires=['rex.setup'],
      install_requires=['rexrunner',
                        'rex.common>=1.0.0',
                        'rex.ext>=1.0.0',
                        ],
)
