**********************************
Assessment import with calculation
**********************************

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

Should run calculations::

  >>> input = ImportPackage.from_csv(path='./test/data/calculation1.csv')

  >>> import_assessment(instrument_uid='calculation', version=1, input=input)
  ### CREATED 2 ASSESSMENTS
  ### CREATED RECORDSET fake_assessment_1 {u'calc1': 47, u'calc2': 149, u'calc3': True}
  ### SAVED ASSESSMENT fake_assessment_1
  ### CREATED RECORDSET fake_assessment_1 {u'calc1': 50, u'calc2': 129, u'calc3': True}
  ### SAVED ASSESSMENT fake_assessment_1

  >>> app.off()
