***************
Template export
***************

.. contents:: Table of Contents

Function ``export_template`` is used to export instrument template
as bunch of csv files or as xls file.
The function expects one mandatory parameter ``instrument_uid``,
and four optional parameters:
``version`` - instrument version, latest version by default,
``output`` - path to directory to save template, by default current directory,
``format`` - csv or xls is expected, csv by default,
``verbose`` - boolean value indicates if log are shown, False by default.

::

  >>> import os
  >>> from rex.core import Rex
  >>> from rex.assessment_import import export_template

  >>> app = Rex('rex.assessment_import_demo')
  >>> app.on()

Instrument must exist in the data store::

  >>> export_template(instrument_uid='notexists')
  Traceback (most recent call last):
  ...
  Error: Instrument "notexists" does not exist.

If version given, it must exist in the data store::

  >>> export_template(instrument_uid='complex', version=3)
  Traceback (most recent call last):
  ...
  Error: The desired version of "Complex Instrument" does not exist.

If format is given, one of csv or xls is expected::

  >>> export_template(instrument_uid='qctest', format='xlsx')
  Traceback (most recent call last):
  ...
  Error: Format xlsx is unknown. One of xls, csv is expected

  >>> export_template(instrument_uid='qctest', output='./build/sandbox/csv')

A bunch of csv template files is created::

  >>> for filename in sorted(os.listdir('./build/sandbox/csv')):
  ...       print filename
  qctest1.csv
  qctest1.matrix.csv
  qctest1.q_matrix1.csv
  qctest1.q_matrix2.csv
  qctest1.recordlist.csv
  qctest1.recordlist2.csv
  qctest1.recordlist3.csv
  qctest1.recordlist4.csv
  qctest1.recordlist5.csv

To export instrument template as xls, format should be specified::

  >>> export_template(instrument_uid='qctest',
  ...                 output='./build/sandbox/xls',
  ...                 format='xls')

Template saved as xls file::

  >>> for filename in sorted(os.listdir('./build/sandbox/xls')):
  ...       print filename
  qctest1.xls
