****************
REX.CTL Commands
****************

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.ctl import ctl

assessment-export-template
==========================

The ``assessment-export-template`` command will export the Common Instrument
Definition JSON from an InstrumentVersion in the project data store
to CSV files::

    >>> ctl('help assessment-export-template')
    ASSESSMENT-EXPORT-TEMPLATE - exports an InstrumentVersion from the datastore
    Usage: rex assessment-export-template [<project>] <instrument-uid>
    <BLANKLINE>
    The assessment-export-template task will export an InstrumentVersion from a
    project's data store and save generated output as a bunch of csv files.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument in
    the data store.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional parameter
      --set=PARAM=VALUE        : set a configuration parameter
      --version=VERSION        : the version of the Instrument to retrieve; if not specified, defaults to the latest version
      --output=OUTPUT_PAT      : the direcory to generated csv files write to; if not specified, current directory is used
    <BLANKLINE>

It requires a single argument which is the UID of the Instrument to export::

    >>> ctl('assessment-export-template', expect=1)
    FATAL ERROR: too few arguments for task assessment-export-template: missing <instrument-uid>
    <BLANKLINE>

It fails if given instrument UID doesnot exist::

    >>> ctl('assessment-export-template --project=rex.assessment_import_demo doesnotexist', expect=1)
    FATAL ERROR: Instrument "doesnotexist" does not exist.
    <BLANKLINE>

    >>> ctl('assessment-export-template --project=rex.assessment_import_demo simple')

