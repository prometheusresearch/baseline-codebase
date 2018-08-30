*****************
Assessment import
*****************

.. contents:: Table of Contents

Function ``import_assessment`` is used to import assessments to the data store.
The function expects string parameter ``instrument_uid`` and ``input`` as an
ImportPackage object.
Optional parameters:
``version`` - instrument version, latest version by default,
``verbose`` - boolean value indicates if log are shown, False by default.
``user`` - initiated import.

::

  >>> import os
  >>> from rex.core import Rex
  >>> from rex.assessment_import import import_assessment, ImportPackage

  >>> app = Rex('rex.assessment_import_demo')
  >>> app.on()

Parameter input is expected::

  >>> import_assessment(instrument_uid='notexists')
  Traceback (most recent call last):
  ...
  Error: input is expected.

Parameter input is expected as an object of ImportPackage::

  >>> import_assessment(instrument_uid='notexists',
  ...                   input='./test/data/eeg-upload1.xls')
  Traceback (most recent call last):
  ...
  Error: input is expected as an object of ImportPackage.

Generate ImportPackage object::

  >>> input = ImportPackage.from_xls(path='./test/data/eeg-upload1.xls')

Instrument must exist in data storage::

  >>> import_assessment(instrument_uid='notexists', input=input)
  Traceback (most recent call last):
  ...
  Error: Instrument "notexists" does not exist.

If version given it must exist in data storage::

  >>> import_assessment(instrument_uid='eeg-upload', version=3, input=input)
  Traceback (most recent call last):
  ...
  Error: The desired version of "Test Instrument" does not exist.

  >>> import_assessment(instrument_uid='eeg-upload', version=1, input=input)
  ### CREATED 2999 ASSESSMENTS

When parameter verbose is set, import_assessment shows logs::

  >>> import_assessment(instrument_uid='eeg-upload', version=1, input=input,
  ...                   verbose=True)
  Looking for instrument...
  Generating instrument template...
  Generating assessments collection for given input...
  Processing chunk `eeg-upload1`...
  Processing chunk `eeg-upload1.abspower`...
  Saving generated assessments to the data store...
  ### CREATED 2999 ASSESSMENTS

  >>> input = ImportPackage.from_xls(path='./test/data/qctest1.xls', user='demo')
  >>> import_assessment(instrument_uid='qctest', input=input, verbose=True)
  Looking for instrument...
  Generating instrument template...
  Generating assessments collection for given input...
  Processing chunk `qctest1`...
  Processing chunk `qctest1.matrix`...
  Processing chunk `qctest1.recordlist2`...
  Saving generated assessments to the data store...
  ### CREATED 2 ASSESSMENTS

When application started with the setting assessment_import_dir, failed
failed chunks saved in <assessment_import_dir>/<username>/<when>-<chunk.id>.csv,
where <username> is user given as function parameter or 'unknown'.

::

  >>> app = Rex('rex.assessment_import_demo',
  ...           assessment_import_dir='./build/sandbox')
  >>> app.on()

  >>> input = ImportPackage.from_directory(path='./test/data/errors/eeg-upload0',
  ...                                      user='demo')

Import data contains extra file eeg-upload2.csv that does not match to
instrument template::

  >>> import_assessment(instrument_uid='eeg-upload', version=1, input=input) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Chunk `eeg-upload2` not found in instrument `eeg-upload1` template.

Extra chunk saved::

  >>> print([filename for filename in os.listdir('./build/sandbox/demo')
  ...                   if filename.endswith('eeg-upload2.csv')])  # doctest: +ELLIPSIS
  ['...-eeg-upload2.csv']

Import fails when it is unable to read one of csv files stored in directory::

  >>> input = ImportPackage.from_directory(path='./test/data/errors/eeg-upload1',
  ...                                      user='demo')  # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Unable to read csv .../src/rex.assessment_import/test/data/errors/eeg-upload1/eeg-upload1.csv
      line contains NULL byte

Import fails when data header does not match instrument template header::

  >>> input = ImportPackage.from_csv(path='./test/data/errors/qctest/csv/1/qctest1.csv',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row # 1 does not match template
      data header contains extra columns extra_column.

Import fails when data header does not contain all columns listed in chunk
template::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest1.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row # 1 does not match template
      data header does not contain expected columns enumerationset5_france, text12.

Import fails when header of csv files contains less columns than at least one
of the csv rows::

  >>> input = ImportPackage.from_csv(path='./test/data/errors/qctest/csv/2/qctest1.csv',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row # 1 does not match template
      nulls is not expected in data header.

Import fails when one of the data rows contain null in assessment_id::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest2.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row # 1, assessment_id not found.

Import fails when record (instrument) chunk contains duplicated assessment_id::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest19.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Duplicated assessment_id `1.0` chunk `qctest1` row # 2.

Import fails when matrix chunk contains duplicated assessment_id::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest20.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Duplicated assessment_id `1.0` chunk `qctest1.matrix` row # 2.

Import fails when one of the data rows contain null in subject::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest14.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #2
      subject is required.

Import fails when field from instrument implementation context is required and
contains no value::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest15.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
      study1 value is required in qctest1.

Import fails when field from instrument implementation context contains value
can not be validated with its validator::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest16.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
      Got unexpected study1 value in qctest1
          Expected a float value
          Got:
              u'study1'

Import fails when assessment implementation method bulk_create failed::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest17.xls',
  ...                                user='demo1')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Bulk create failed with unexpected study1.

When application started with the parameter assessment_import_dir, and method
bulk_create failed all import data saved as cvs files
in <assessment_import_dir>/<username>/<when>-<chunk_name>.csv::

  >>> print(sorted(os.listdir('./build/sandbox/demo1'))) # doctest: +ELLIPSIS
  ['...-qctest1.csv', '...-qctest1.matrix.csv', '...-qctest1.recordlist2.csv']

Import fails when data column contains bad value.

bad evaluation date::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest3.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
      Unexpected value date for date.

bad integer::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest4.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
       Got unexpected value int for field integer of integer type.

bad float::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest5.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
       Got unexpected value float for float type field float.

bad enumeration::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest6.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
      Got unexpected value 0.0 of enumeration type, one of ['blue', 'bright-yellow', 'purple', 'yellow', 'baby-pink', 'pink', 'black', 'red', 'white', 'royal-blue', 'dark-red', 'cream'] is expected for field enumeration3.

required field not given::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest7.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
      Got null for required field boolean.

bad boolean::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest8.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
       Got unexpected value boolean of boolean type field boolean.

bad date::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest9.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
       Got unexpected value date1 of date type, YYYY-MM-DD is expected for field date1.

bad time::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest10.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
       Got unexpected value time of time type, HH:MM:SS is expected for field time.

bad datetime::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest11.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
      Got unexpected value datetime of dateTime type, YYYY-MM-DDTHH:MM:SS is expected for field datetime.

required enumerationSet is not given::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest12.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
      Not found value of required field enumerationset1

bad enumerationSet::

  >>> input = ImportPackage.from_xls(path='./test/data/errors/qctest/qctest13.xls',
  ...                                user='demo')

  >>> import_assessment(instrument_uid='qctest', input=input)
  Traceback (most recent call last):
  ...
  Error: Check chunk `qctest1` row #1
      Got unexpected value english for enumerationset1_english.
          TRUE or FALSE is expected for enumerationSet field



