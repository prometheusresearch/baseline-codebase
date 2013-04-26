
from setuptools import setup, find_packages

setup(name='rex.formbuilder',
      version='0.1.0',
      description="Your description here",
      setup_requires=['rexsetup'],
      # Uncomment next 2 lines if you are adding any python code
      packages=find_packages('src'),
      package_dir={'': 'src'},
      include_package_data = True,
      # www_prefix is url prefix where other packages may find your files & commands.
      # It is ignored if your project is the main one served (root). 
      # In that case everything could be found just at root '/'.
      # In your templates you never use this value as is, instead you do like this:
      # <script src="{{ PREFIX['rex.ext'] }}/jquery/jquery-1.5.3.js"></script>
      www_prefix='/rex-formbuilder',
      # www_dir is the directory where you store servable static files 
      # & jinja templates
      www_dir='www',
      # www_module is the Python module where you register commands, 
      # authenticators & custom handlers
      www_module='rex.formbuilder',
      # www_settings is a Yaml file where you could store default parameters 
      # for you package or overriding values for other packages
      www_settings='settings.yaml',

# Please note, that any change to the setup() parameters requires you to 
# re-install the package.
# Use 'python setup.py develop' in development mode 
# or 'python setup.py install' in deployment mode.

      # Dependency information
      install_requires=['rexrunner', 
          'HTSQL>=2.3.3',
          'REX.COMMON>=0.1.0',
          'REX.EXT>=0.1.0',
          'REX.FORMS>=0.1.0'
          ],
)
