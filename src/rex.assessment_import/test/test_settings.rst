********
Settings
********

.. contents:: Table of Contents

Setting assessment_import_dir expects path to existed and writable directory
to save files of failed imports.

When the setting has value and directory does not exist or is not writable
application start fails::

  >>> from rex.core import Rex

  >>> app = Rex('rex.assessment_import_demo', assessment_import_dir='errors')
  Traceback (most recent call last):
  ...
  Error: Asessment import storage (assessment_import_dir) does not exist:
      errors
  While initializing RexDB application:
      rex.assessment_import_demo
  With parameters:
      assessment_import_dir: 'errors'

  >>> app = Rex('rex.assessment_import_demo', assessment_import_dir='/etc')
  Traceback (most recent call last):
  ...
  Error: Asessment import storage (assessment_import_dir) is not accessible:
      /etc
  While initializing RexDB application:
      rex.assessment_import_demo
  With parameters:
      assessment_import_dir: '/etc'

Application successfully started, when directory exists and accessable::

  >>> app = Rex('rex.assessment_import_demo',
  ...           assessment_import_dir='./build/sandbox')

Application successfully started, when setting assessment_import_dir has
no value (failed imports won't be saved)::

  >>> app = Rex('rex.assessment_import_demo')

