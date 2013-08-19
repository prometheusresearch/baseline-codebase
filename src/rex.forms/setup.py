
from setuptools import setup, find_packages

setup(name='rex.forms',
      version="0.9.9",
      description="RexForms client Javascript code & templates",
      include_package_data=True,

      rex_static='static',

      setup_requires=['rex.setup'],
      install_requires=['rex.web',
        'rex.common>=0.9',
        'rex.ext>=0.9',
      ],
)
