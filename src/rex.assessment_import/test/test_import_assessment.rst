*****************
Assessment import
*****************

.. contents:: Table of Contents

Function ``import_assessment`` is used to import assessments to the data store,
stored as multitabs xls file, as a one csv ore a bunch of csv files.
The function expects one parameter ``instrument_uid``,
and four optional parameters:
``version`` - instrument version, latest version by default,
``input`` - path to csv, xls, zip file or directory with stored
to save template, by default current directory,
``verbose`` - boolean value indicates if log are shown, False by default.

::

  >>> import os
  >>> from rex.core import Rex
  >>> from rex.assessment_import import import_assessment

  >>> app = Rex('rex.assessment_import_demo')
  >>> app.on()

Instrument must exist in the data store::

  >>> import_assessment(instrument_uid='notexists')
  Traceback (most recent call last):
  ...
  Error: Instrument "notexists" does not exist.

If version given, it must exist in the data store::

  >>> import_assessment(instrument_uid='complex', version=3)
  Traceback (most recent call last):
  ...
  Error: The desired version of "Complex Instrument" does not exist.

  >>> import_assessment(instrument_uid='eeg-upload', verbose=True)
  Starting assessment import...
  Looking for instrument version in the data store...
  Generating template for the instrument version eeg-upload1...
  Reading input data...
  No import data found.

input is a zip conatined a bunch of csv::

  >>> import_assessment(instrument_uid='eeg-upload',
  ...                   input='test/data/eeg-upload1.zip',
  ...                   verbose=True)
  Starting assessment import...
  Looking for instrument version in the data store...
  Generating template for the instrument version eeg-upload1...
  Reading input data...
  Checking data with instrument template...
  Generating assessment 1 json...
  Generating assessment 2 json...
  Generating assessment 3 json...
  Generating assessment 4 json...
  Generating assessment 5 json...
  Saving assessments...
  ### CREATED 5 ASSESSMENTS
  Assessment import finished.

input is a directory contained csvs::

  >>> import_assessment(instrument_uid='eeg-upload',
  ...                   input='test/data/eeg-upload',
  ...                   verbose=True)
  Starting assessment import...
  Looking for instrument version in the data store...
  Generating template for the instrument version eeg-upload1...
  Reading input data...
  Checking data with instrument template...
  Generating assessment 1 json...
  Generating assessment 2 json...
  Generating assessment 3 json...
  Generating assessment 4 json...
  Generating assessment 5 json...
  Saving assessments...
  ### CREATED 5 ASSESSMENTS
  Assessment import finished.

input is xls file::

  >>> assessments = import_assessment(instrument_uid='eeg-upload',
  ...                                 input='test/data/eeg-upload1.xls')
  ### CREATED 2999 ASSESSMENTS

input is xls contained recordList, enumerationSet, matrix and other fields::

  >>> import_assessment(instrument_uid='qctest',
  ...                   input='test/data/qctest1.xls',
  ...                   verbose=True)
  Starting assessment import...
  Looking for instrument version in the data store...
  Generating template for the instrument version qctest1...
  Reading input data...
  Checking data with instrument template...
  Generating assessment 1.0 json...
  Saving assessments...
  ### CREATED 1 ASSESSMENTS
  Assessment import finished.

input is csv contained unicode in a text field::

  >>> import_assessment(instrument_uid='qctest',
  ...                   input='test/data/qctest2.csv',
  ...                   verbose=True)
  Starting assessment import...
  Looking for instrument version in the data store...
  Generating template for the instrument version qctest1...
  Reading input data...
  Checking data with instrument template...
  Generating assessment 1 json...
  Saving assessments...
  ### CREATED 1 ASSESSMENTS
  Assessment import finished.

Import fails when template header and data header are different::

  >>> import_assessment(instrument_uid='eeg-upload',
  ...                   input='test/data/errors/eeg-upload',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: eeg-upload1 data header contains extra columns date1.

  >>> import_assessment(instrument_uid='eeg-upload',
  ...                   input='test/data/errors/eeg-upload1',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: eeg-upload1 data header does not contain expected columns eeg_data.

Import fails when assessment date contains bad formatted value::

  >>> import_assessment(instrument_uid='eeg-upload',
  ...                   input='test/data/errors/eeg-upload2',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: Bad data is given for assessment 1
      Unexpected value 20160601 for evaluation_date.

Import fails when data contains unexpected value.

bad enumeration value::

  >>> import_assessment(instrument_uid='eeg-upload',
  ...                   input='test/data/errors/eeg-upload3',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: Bad data is given for assessment 1
      Got unexpected value 2 of enumeration type, one of ['1', 'a', 'c', 'b', 'd'] is expected for field eeg_data.

bad integer value::

  >>> import_assessment(instrument_uid='qctest',
  ...                   input='test/data/errors/qctest2.xls',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: Bad data is given for assessment 1.0
       Got unexpected value integer for field integer of integer type.

bad float value::

  >>> import_assessment(instrument_uid='qctest',
  ...                   input='test/data/errors/qctest3.xls',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: Bad data is given for assessment 1.0
       Got unexpected value float for float type field float.

  >>> import_assessment(instrument_uid='qctest',
  ...                   input='test/data/errors/qctest4.csv',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: Bad data is given for assessment 1
       Got unexpected value 1.1.1 for float type field float.

bad boolean value::

  >>> import_assessment(instrument_uid='qctest',
  ...                   input='test/data/errors/qctest5.csv',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: Bad data is given for assessment 1
       Got unexpected value boolean of boolean type field boolean.

required field has no value::

  >>> import_assessment(instrument_uid='qctest',
  ...                   input='test/data/errors/qctest6.csv',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: Bad data is given for assessment 1
      Got null for required field boolean.

bad date value::

  >>> import_assessment(instrument_uid='qctest',
  ...                   input='test/data/errors/qctest7.csv',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: Bad data is given for assessment 1
       Got unexpected value date of date type, YYYY-MM-DD is expected for field date1.

bad time value::

  >>> import_assessment(instrument_uid='qctest',
  ...                   input='test/data/errors/qctest8.csv',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: Bad data is given for assessment 1
       Got unexpected value time of time type, HH:MM:SS is expected for field time.

bad datetime value::

  >>> import_assessment(instrument_uid='qctest',
  ...                   input='test/data/errors/qctest9.csv',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: Bad data is given for assessment 1
      Got unexpected value datetime of dateTime type, YYYY-MM-DDTHH:MM:SS is expected for field datetime.

bad enumerationSet value::

  >>> import_assessment(instrument_uid='qctest',
  ...                   input='test/data/errors/qctest10.csv',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: Bad data is given for assessment 1
      Got unexpected value arabic for enumerationset1_arabic.
          TRUE or FALSE is expected for enumerationSet field

When application started with the setting assessment_import_dir, import files
saved by the path <assessment_import_dir>/<username>/<when>-<filename>

When assessment_import_dir does not exist, application start failed::

  >>> app = Rex('rex.assessment_import_demo',
  ...           assessment_import_dir='./build/sandbox/errors')
  Traceback (most recent call last):
  ...
  Error: Asessment import storage (assessment_import_dir) does not exist:
      ./build/sandbox/errors
  While initializing RexDB application:
      rex.assessment_import_demo
  With parameters:
      assessment_import_dir: './build/sandbox/errors'

  >>> app = Rex('rex.assessment_import_demo',
  ...           assessment_import_dir='./build/sandbox/')
  >>> app.on()

bad enumerationSet value::

  >>> import_assessment(instrument_uid='qctest',
  ...                   input='test/data/errors/qctest10.csv',
  ...                   verbose=True)
  Traceback (most recent call last):
  ...
  Error: Bad data is given for assessment 1
      Got unexpected value arabic for enumerationset1_arabic.
          TRUE or FALSE is expected for enumerationSet field

failed import file saved::

  >>> os.path.exists('./build/sandbox/import.log')
  True

  >>> failed_saved = False
  >>> for filename in os.listdir('./build/sandbox/unknown'):
  ...   if filename.endswith('qctest10.csv'): failed_saved = True
  >>> print failed_saved
  True

