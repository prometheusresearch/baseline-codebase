
from setuptools import setup, find_packages

setup(name='rex.expression',
      version = "1.0.0",
      description="JavaScript library to parse HTSQL expressions",
      setup_requires=['rex.setup >= 1.1, <2'],
#      packages=find_packages('src'),
#      package_dir={'': 'src'},
#      include_package_data = True,
#      namespace_packages=['rex'],

      # Dependency information
      install_requires=[
          'rex.web>0.9,<3'
      ],
      rex_static='static',
#      rex_init='rex.expression'
)
