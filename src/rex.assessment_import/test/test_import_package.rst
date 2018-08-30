**************
Import package
**************

::

  >>> import os
  >>> from rex.core import Rex
  >>> from rex.assessment_import import import_assessment, ImportPackage

  >>> app = Rex('rex.assessment_import_demo')
  >>> app.on()

classmethods to create ImportPackage object
===========================================

ImportPackage constructor expects a list of ImportChunk objects.
ImportChunk constructor expects string parameter id, a list of dicts as
parameter data and optional parameter user who generated the chunk.
ImportPackage object can be generated with constructor or one of the next
classmethods:

from_directory
++++++++++++++

from_directory(path, user=None) to generate package from a bunch of csv files
  stored in directory given by path, where import initiated by user::

  >>> input = ImportPackage.from_directory('./test/data/eeg-upload/')
  >>> for chunk in sorted(input, key=lambda x: x.id):
  ...   print(chunk.id, len(chunk.data))
  eeg-upload1 2999
  eeg-upload1.abspower 249

When given path is not a directory assertion error appeared::

  >>> input = ImportPackage.from_directory('./test/data/eeg-upload1.xls')
  Traceback (most recent call last):
  ...
  AssertionError

from_xls
++++++++

- from_xls(path, user=None) to generate package from multitabs xls file::

  >>> input = ImportPackage.from_xls('./test/data/eeg-upload1.xls')
  >>> for chunk in input:
  ...   print(chunk.id, len(chunk.data))
  eeg-upload1 2999
  eeg-upload1.abspower 4980

When given path parameter is not xls file assertion error appeared::

  >>> input = ImportPackage.from_xls('./test/data/eeg-upload/')
  Traceback (most recent call last):
  ...
  AssertionError

  >>> input = ImportPackage.from_xls('./test/data/qctest2.csv')
  Traceback (most recent call last):
  ...
  AssertionError

When not readable xls file given::

  >>> input = ImportPackage.from_xls('./test/data/errors/qctest/qctest18.xls')
  Traceback (most recent call last):
  ...
  Error: Bad xls file
      File size is 0 bytes

from_csv
++++++++

- from_csv(path, user=None) to generate package from single csv file::

  >>> input = ImportPackage.from_csv('./test/data/qctest2.csv')
  >>> for chunk in input:
  ...   print(chunk.id, len(chunk.data))
  qctest2 1

When given path parameter is not csv file assertion error appeared::

  >>> input = ImportPackage.from_csv('./test/data/eeg-upload/')
  Traceback (most recent call last):
  ...
  AssertionError

  >>> input = ImportPackage.from_csv('./test/data/eeg-upload1.xls')
  Traceback (most recent call last):
  ...
  AssertionError

When csv file is unreadable::

  >>> input = ImportPackage.from_csv('./test/data/errors/qctest/csv/qctest19.csv')
  Traceback (most recent call last):
  ...
  Error: Unable to read csv ./test/data/errors/qctest/csv/qctest19.csv.
      line contains NULL byte

from_zip
++++++++

- from_zip(path, user=None) to generate package from zipped bunch of csv files::

  >>> input = ImportPackage.from_zip('./test/data/eeg-upload1.zip')
  >>> for chunk in input:
  ...   print(chunk.id, len(chunk.data))
  eeg-upload1.abspower 249
  eeg-upload1 2999

When given path parameter is not zip file assertion error appeared::

  >>> input = ImportPackage.from_zip('./test/data/eeg-upload/')
  Traceback (most recent call last):
  ...
  AssertionError

methods to create ImportPackage output
======================================

::
  >>> package = ImportPackage.from_zip('./test/data/eeg-upload1.zip')

as_xls_file
+++++++++++

Use method as_xls_file to generate xls file content::

  >>> filename, filecontent = package.as_xls_file()
  >>> print(filename, len(filecontent))
  eeg-upload1.xls 888832

as_zip_file
+++++++++++

Use method as_zip_file to generate zip file content with a bunch of csv files::

  >>> filename, filecontent = package.as_zip_file()
  >>> print(filename, len(filecontent))
  eeg-upload1.zip 316686

Saving failed data
==================

classmethod fail(exc, input, user)
++++++++++++++++++++++++++++++++++

When method started to generate ImportPackage failed, classmethod fail(...)
triggered. When application started without setting assessment_import_dir,
method fail(...) just raised given exception::

  >>> input = ImportPackage.from_xls('./test/data/errors/qctest/qctest0.xls')
  Traceback (most recent call last):
  ...
  Error: Unexpected xls file ./test/data/errors/qctest/qctest0.xls.
      Sheet 0 contains less than 2 rows.

When application started with assessment_import_dir, method fail saved an
exception to import.log file, copied failed input data to the path
<assessment_import_dir>/<user>/<when>-<filename>, and raise an exception::

  >>> app.off()
  >>> app = Rex('rex.assessment_import_demo',
  ...           assessment_import_dir='./build/sandbox')
  >>> app.on()
  >>> input = ImportPackage.from_xls('./test/data/errors/qctest/qctest0.xls')
  Traceback (most recent call last):
  ...
  Error: Unexpected xls file ./test/data/errors/qctest/qctest0.xls.
      Sheet 0 contains less than 2 rows.

  >>> os.path.exists('./build/sandbox/import.log')
  True

  >>> print([filename for filename in os.listdir('./build/sandbox/unknown')
  ...                 if filename.endswith('-qctest0.xls')]) # doctest: +ELLIPSIS
  ['...-qctest0.xls']

