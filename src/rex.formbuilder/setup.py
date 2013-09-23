
from setuptools import setup, find_packages

setup(name='rex.formbuilder',
      version='0.9.9',
      description="Your description here",
      entry_points = {
          'rdoma.modules': ['rex_formbuilder = rex.formbuilder.deploy'],
      },
      setup_requires=['rex.setup'],
      packages=find_packages('src'),
      package_dir={'': 'src'},
      namespace_packages=['rex'],
      include_package_data = True,
      install_requires=['rex.web',
          'htsql>=2.3.3',
          'rex.common>=0.9',
          'rex.ext>=0.9',
          'rex.forms>=0.9',
          'rex.instrument',
      ],

      rex_static='static',
      rex_init='rex.formbuilder',
)
