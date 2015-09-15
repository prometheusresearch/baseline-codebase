****************
REX.CTL Commands
****************

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.ctl import ctl

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
    project's data store and save generated output as a bunch of csv files.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument in
    the data store.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional parameter
      --set=PARAM=VALUE        : set a configuration parameter
      --version=VERSION        : the version of the Instrument to export template; if not specified, defaults to the latest version
      --output=OUTPUT_PATH     : the directory to keep generated csv files write to; if not specified, current directory is used
    <BLANKLINE>

It requires a single argument which is the UID of the Instrument to export::

    >>> ctl('assessment-template-export', expect=1)
    FATAL ERROR: too few arguments for task assessment-template-export: missing <instrument-uid>
    <BLANKLINE>

It fails if given instrument UID doesnot exist::

    >>> ctl('assessment-template-export --project=rex.assessment_import_demo doesnotexist', expect=1)
    FATAL ERROR: Instrument "doesnotexist" does not exist.
    <BLANKLINE>

    >>> ctl('assessment-template-export --project=rex.assessment_import_demo simple --output ./build/sandbox')

    >>> template = open("./build/sandbox/simple1.csv").readlines()
    >>> print template
    ['subject,date,assessment_id,q_fake\r\n', 'Please provide the subject id here,Please provide a date (YYYY-MM-DD),Please provide a unique id for this assessement,"[""text""]"\r\n']

assessment-import
=================

The ``assessment-import`` command will import assessments data given in
the bunch of csv files as Assessment objects to the datastore::

    >>> ctl('help assessment-import')
    ASSESSMENT-IMPORT - imports Assessment data given as a bunch of csv files to the datastore.
    Usage: rex assessment-import [<project>] <instrument-uid>
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument in
    the data store.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional parameter
      --set=PARAM=VALUE        : set a configuration parameter
      --version=VERSION        : the version of the Instrument to generate assessments for; if not specified, defaults to the latest version
      --input=INPUT_PATH       : the directory contained assessments data stored in csv files; if not specified, current directory is used
    <BLANKLINE>

    >>> ctl('assessment-import', expect=1)
    FATAL ERROR: too few arguments for task assessment-import: missing <instrument-uid>
    <BLANKLINE>

    >>> ctl('assessment-import --project=rex.assessment_import_demo doesnotexist', expect=1)
    FATAL ERROR: Instrument "doesnotexist" does not exist.
    <BLANKLINE>

    >>> ctl('assessment-import --project=rex.assessment_import_demo simple', expect=1)
    FATAL ERROR: Not found any csv file appropriate to import.
    <BLANKLINE>

    >>> open('./build/sandbox/simple1.csv', 'w').write('subject,assessment_id,date,q_fake\nsubject1,1,,')
    >>> ctl('assessment-import --project=rex.assessment_import_demo simple --input ./build/sandbox/')
    Starting assessment 1 import...
    ### SAVED ASSESSMENT fake_assessment_1
    Import finished, assessment fake_assessment_1 generated.
