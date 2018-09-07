***************
Template export
***************

.. contents:: Table of Contents

Function ``export_template`` is used to export instrument as ImportPackage
object.
The function expects one mandatory parameter ``instrument_uid``,
and the next optional parameters:
``version`` - instrument version, latest version by default,
``verbose`` - boolean value indicates if log are shown, False by default.
``user`` - user initiator of instrument export.

::

  >>> from rex.core import Rex
  >>> from rex.assessment_import import export_template

  >>> app = Rex('rex.assessment_import_demo')
  >>> app.on()

Instrument must exist in the data store::

  >>> export_template(instrument_uid='notexists')
  Traceback (most recent call last):
  ...
  rex.core.Error: Instrument "notexists" does not exist.

If version given, it must exist in the data store::

  >>> export_template(instrument_uid='complex', version=3)
  Traceback (most recent call last):
  ...
  rex.core.Error: The desired version of "Complex Instrument" does not exist.

Successfull export returns ImportPackage object::

  >>> output = export_template(instrument_uid='qctest')

  >>> output = export_template(instrument_uid='qctest', version=1)

Set parameter verbose to show logs::

  >>> output = export_template(instrument_uid='qctest', version=1, verbose=True)
  Looking for instrument...
  Generating instrument template...

use ImportPackage.as_zip_file metod to process data as zip file, contained
a bunch of csv files::

  >>> zip_file_name, zip_file_content = output.as_zip_file()
  >>> print(zip_file_name)
  qctest1.zip

use ImportPackage.as_xls_file metod to process data as xls::

  >>> xls_file_name, xls_file_content = output.as_xls_file()
  >>> print(xls_file_name)
  qctest1.xls

use ImportPackage.as_csv_file metod to process data as csv file, when package
contains only one data chunk::

  >>> output = export_template(instrument_uid='calctest', version=1, verbose=True)
  Looking for instrument...
  Generating instrument template...

  >>> csv_file_name, csv_file_content = output.as_csv_file()
  >>> print(csv_file_name)
  calctest1.csv

When package consists on more than one chunks, ImportPackage.as_csv_file fails::

  >>> output = export_template(instrument_uid='qctest', version=1, verbose=True)
  Looking for instrument...
  Generating instrument template...

  >>> print(len(output.chunks))
  9

  >>> csv_file_name, csv_file_content = output.as_csv_file()
  Traceback (most recent call last):
  ...
  rex.core.Error: Unable to generate csv file for more than one chunk

