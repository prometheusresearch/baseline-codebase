****************
REX.CTL Commands
****************

.. contents:: Table of Contents


Set up the environment::

  >>> from rex.ctl import ctl
  >>> import os.path
  >>> import xlwt
  >>> import zipfile

assessment-template-export
==========================

The ``assessment-template-export`` command will export the Common Instrument
Definition JSON from an InstrumentVersion in the project data store
to CSV files::

  >>> ctl('help assessment-template-export')
  ASSESSMENT-TEMPLATE-EXPORT - exports an InstrumentVersion from the datastore
  Usage: rex assessment-template-export [<project>] <instrument-uid>
  <BLANKLINE>
  The assessment-template-export task will export an InstrumentVersion from a
  project's data store and save generated output in given format,
  default format is csv.
  The instrument-uid argument is the UID of the desired Instrument in
  the data store.
  <BLANKLINE>
  Options:
    --require=PACKAGE        : include an additional package
    --set=PARAM=VALUE        : set a configuration parameter
    --version=VERSION        : the version of the Instrument to export template; if not specified, defaults to the latest version
    --output=OUTPUT_PATH     : the directory to keep generated files write to; if not specified, current directory is used
    --format=FORMAT          : the format of output files one of csv or xls is expected; csv is the default value
    --verbose                : Show logs
  <BLANKLINE>

Command requires a single argument which is the UID of the Instrument to export::

  >>> ctl('assessment-template-export', expect=1)
  FATAL ERROR: too few arguments for task assessment-template-export: missing <instrument-uid>
  <BLANKLINE>

Command fails if given instrument UID doesnot exist::

  >>> ctl('assessment-template-export --project=rex.assessment_import_demo doesnotexist', expect=1)
  FATAL ERROR: Instrument "doesnotexist" does not exist.
  <BLANKLINE>

Command may return template as zipped bunch of csv files, by the default or
when --format option is csv::
  
  >>> ctl('assessment-template-export --project=rex.assessment_import_demo simple --output ./build/sandbox')

  >>> print(os.path.exists('./build/sandbox/simple1.zip'))
  True

  >>> ctl('assessment-template-export --project=rex.assessment_import_demo simple --output ./build/sandbox --format csv')

  >>> with zipfile.ZipFile('./build/sandbox/simple1.zip', 'r') as zf:
  ...       for filepath in zf.namelist():
  ...           print(zf.open(filepath, 'rU').readlines())
  ['subject,date,assessment_id,study,study1,q_fake\n', 'Please provide the subject id here; (required),Please provide a date (YYYY-MM-DD),Please provide a unique id for this assessement; (required),,(required),text\n']



or as xls file::

  >>> ctl('assessment-template-export --project=rex.assessment_import_demo simple --output ./build/sandbox --format xls')
  >>> os.path.exists('./build/sandbox/simple1.xls')
  True

it fails if option --format got unknown value (csv or xls is expected)::

  >>> ctl('assessment-template-export --project=rex.assessment_import_demo simple --output ./build/sandbox --format txt', expect=1)
  FATAL ERROR: Format txt is unknown.
  <BLANKLINE>

assessment-import
=================

The ``assessment-import`` command will import assessments data given in
the bunch of csv files as Assessment objects to the datastore::

  >>> ctl('help assessment-import')
  ASSESSMENT-IMPORT - imports Assessment data given as a zip, bunch of csv or xls
  Usage: rex assessment-import [<project>] <instrument-uid>
  <BLANKLINE>
  to the datastore.
  <BLANKLINE>
  The instrument-uid argument is the UID of the desired Instrument in
  the data store.
  <BLANKLINE>
  Options:
    --require=PACKAGE        : include an additional package
    --set=PARAM=VALUE        : set a configuration parameter
    --version=VERSION        : the version of the Instrument to generate assessments for; if not specified, defaults to the latest version
    --input=INPUT_PATH       : the directory contained assessments data stored in csv filesor path to .xls file
    --verbose                : Show logs
  <BLANKLINE>

Command fails when no parameters given, it is expected 2 parameters
(instrument and input path)::

  >>> ctl('assessment-import', expect=1)
  FATAL ERROR: too few arguments for task assessment-import: missing <instrument-uid>
  <BLANKLINE>

Command fails when no import files given::

  >>> ctl('assessment-import --project=rex.assessment_import_demo simple', expect=1)
  FATAL ERROR: No data to import.
  <BLANKLINE>

Command fails when instrument does not exist:: 

  >>> ctl('assessment-import --project=rex.assessment_import_demo doesnotexist --input ./test/data/eeg-upload1.xls', expect=1)
  FATAL ERROR: Instrument "doesnotexist" does not exist.
  <BLANKLINE>

  >>> ctl('assessment-import --project=rex.assessment_import_demo eeg-upload --input ./test/data/eeg-upload1.xls')
  ### CREATED 2999 ASSESSMENTS



