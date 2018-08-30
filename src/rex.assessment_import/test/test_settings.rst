********
Settings
********

.. contents:: Table of Contents

assessment_import_dir
=====================

Setting assessment_import_dir expects path to existed and writable directory
to save files of failed imports.

When the setting has value and directory does not exist or is not writable
application start fails::

  >>> from rex.core import Rex
  >>> from rex.assessment_import import import_assessment, ImportPackage
  >>> from rex.assessment_import.instrument import Instrument
  >>> from rex.assessment_import.template import Template


  >>> app = Rex('rex.assessment_import_demo', assessment_import_dir='errors')
  Traceback (most recent call last):
  ...
  Error: Asessment import storage (assessment_import_dir) does not exist:
      errors
  While initializing RexDB application:
      rex.assessment_import_demo
  With parameters:
      assessment_import_dir: 'errors'

Application successfully started, when directory exists and accessable::

  >>> app = Rex('rex.assessment_import_demo',
  ...           assessment_import_dir='./build/sandbox')

Application successfully started, when setting assessment_import_dir has
no value (failed imports won't be saved)::

  >>> app = Rex('rex.assessment_import_demo')

assessment_context_fields
=========================

The setting ``assessment_context_fields`` expects a list of implementation
context field names, to include into template header.
When ``assessment_context_fields`` is empty list, all implementation
context fields included into template, otherwise only listed fields included.

::
  
  >>> app = Rex('rex.assessment_import_demo')
  >>> app.on()
  >>> instrument = Instrument.find('qctest', 1)
  >>> list(instrument.context.keys())
  ['study', 'study1']

  >>> template = Template(instrument)
  >>> print(list(template['qctest1'].keys()))
  [u'subject', u'date', u'assessment_id', 'study', 'study1', 'integer', 'float', 'text1', 'text5', 'enumeration3', 'boolean', 'date1', 'time', 'datetime', 'enumeration1', 'enumeration2', 'boolean_dropdown', 'another_text', 'enumerationset1_english', 'enumerationset1_russian', 'enumerationset1_hindi', 'enumerationset1_spanish', 'enumerationset1_mandarin', 'enumerationset1_arabic', 'boolean2', 'enumerationset2_dog', 'enumerationset2_hamster', 'enumerationset2_rabbit', 'enumerationset2_cat', 'breed', 'text4', 'text11', 'boolean_fail', 'lookup_text', 'enumeration5', 'enumeration6', 'boolean3', 'q_boolean1', 'q_boolean2', 'enumerationset5_switzerland', 'enumerationset5_other', 'enumerationset5_italy', 'enumerationset5_france', 'text12']

  >>> app = Rex('rex.assessment_import_demo',
  ...           assessment_context_fields=['study1'])
  >>> app.on()
  >>> instrument = Instrument.find('qctest', 1)
  >>> list(instrument.context.keys())
  ['study1']

  >>> template = Template(instrument)
  >>> print(list(template['qctest1'].keys()))
  [u'subject', u'date', u'assessment_id', 'study1', 'integer', 'float', 'text1', 'text5', 'enumeration3', 'boolean', 'date1', 'time', 'datetime', 'enumeration1', 'enumeration2', 'boolean_dropdown', 'another_text', 'enumerationset1_english', 'enumerationset1_russian', 'enumerationset1_hindi', 'enumerationset1_spanish', 'enumerationset1_mandarin', 'enumerationset1_arabic', 'boolean2', 'enumerationset2_dog', 'enumerationset2_hamster', 'enumerationset2_rabbit', 'enumerationset2_cat', 'breed', 'text4', 'text11', 'boolean_fail', 'lookup_text', 'enumeration5', 'enumeration6', 'boolean3', 'q_boolean1', 'q_boolean2', 'enumerationset5_switzerland', 'enumerationset5_other', 'enumerationset5_italy', 'enumerationset5_france', 'text12']

assessment data file contains context columns ``study`` and ``study1``::

  >>> input = ImportPackage.from_xls(path='./test/data/qctest1.xls')
  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row # 1 does not match template
      data header contains extra columns study.

assessment data file contains only context column ``study1``::

  >>> input = ImportPackage.from_xls(path='./test/data/qctest2.xls')
  >>> import_assessment(instrument_uid='qctest', input=input, verbose=True)
  Looking for instrument...
  Generating instrument template...
  Generating assessments collection for given input...
  Processing chunk `qctest1`...
  Processing chunk `qctest1.matrix`...
  Processing chunk `qctest1.recordlist2`...
  Saving generated assessments to the data store...
  ### CREATED 2 ASSESSMENTS

