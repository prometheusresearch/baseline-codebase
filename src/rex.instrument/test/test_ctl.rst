****************
REX.CTL Commands
****************

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.ctl import ctl


instrument-validate
===================

The ``instrument-validate`` command will validate the structure of a JSON file
against the Common Instrument Definition::

    >>> ctl('help instrument-validate')
    INSTRUMENT-VALIDATE - validate a Common Instrument Definition
    Usage: rex instrument-validate <definition>
    <BLANKLINE>
    The instrument-validate task will validate the structure and content of the
    Common Instrument Definition in a JSON (or YAML) file and report back if
    any errors are found.
    <BLANKLINE>
    The only argument to this task is the filename to validate.
    <BLANKLINE>


It requires a single argument which is the path to the file::

    >>> ctl('instrument-validate', expect=1)
    FATAL ERROR: too few arguments for task instrument-validate: missing <definition>
    <BLANKLINE>

    >>> ctl('instrument-validate ./test/instruments/simplest.json')
    "./test/instruments/simplest.json" contains a valid Common Instrument Definition.
    <BLANKLINE>

    >>> ctl('instrument-validate ./test/instruments_yaml/simplest.yaml')
    "./test/instruments_yaml/simplest.yaml" contains a valid Common Instrument Definition.
    <BLANKLINE>


It fails if the JSON structure violates the specification in any way::

    >>> ctl('instrument-validate ./test/instruments/missing_title.json', expect=1)
    FATAL ERROR: u'title' is a required property
    <BLANKLINE>


Or if the file doesn't actually exist::

    >>> ctl('instrument-validate /tmp/does/not/actually/exist.json', expect=1)
    FATAL ERROR: Could not open "/tmp/does/not/actually/exist.json": [Errno 2] No such file or directory: '/tmp/does/not/actually/exist.json'
    <BLANKLINE>


instrument-retrieve
===================

The ``instrument-retrieve`` command will retrieve the Common Instrument
Definition JSON from an InstrumentVersion in the project data store::

    >>> ctl('help instrument-retrieve')
    INSTRUMENT-RETRIEVE - retrieves an InstrumentVersion from the datastore
    Usage: rex instrument-retrieve [<project>] <instrument-uid>
    <BLANKLINE>
    The instrument-retrieve task will retrieve an InstrumentVersion from a
    project's data store and return the Common Instrument Definition JSON.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument in
    the data store.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional parameter
      --set=PARAM=VALUE        : set a configuration parameter
      --version=VERSION        : the version of the Instrument to retrieve; if not specified, defaults to the latest version
      --output=OUTPUT_FILE     : the file to write the JSON to; if not specified, stdout is used
      --pretty                 : if specified, the outputted JSON will be formatted with newlines and indentation
    <BLANKLINE>


It requires a single argument which is the UID of the Instrument to retrieve::

    >>> ctl('instrument-retrieve', expect=1)
    FATAL ERROR: too few arguments for task instrument-retrieve: missing <instrument-uid>
    <BLANKLINE>

    >>> ctl('instrument-retrieve --project=rex.instrument_demo simple')
    {"record": [{"type": "text", "id": "q_fake"}], "version": "1.1", "id": "urn:test-instrument", "title": "The InstrumentVersion Title"}


It takes a ``version`` option to specify which InstrumentVersion of the
Instrument to retrieve::

    >>> ctl('instrument-retrieve --project=rex.instrument_demo complex')
    {"record": [{"type": "text", "id": "q_foo"}, {"type": "integer", "id": "q_bar"}, {"type": "boolean", "id": "q_baz"}], "version": "1.2", "id": "urn:another-test-instrument", "title": "The Other Instrument"}

    >>> ctl('instrument-retrieve --project=rex.instrument_demo complex --version=1')
    {"record": [{"type": "text", "id": "q_foo"}, {"type": "integer", "id": "q_bar"}], "version": "1.1", "id": "urn:another-test-instrument", "title": "The Other Instrument"}


It can also print the JSON in a prettier way::

    >>> ctl('instrument-retrieve --project=rex.instrument_demo complex --pretty')
    {
      "record": [
        {
          "type": "text", 
          "id": "q_foo"
        }, 
        {
          "type": "integer", 
          "id": "q_bar"
        }, 
        {
          "type": "boolean", 
          "id": "q_baz"
        }
      ], 
      "version": "1.2", 
      "id": "urn:another-test-instrument", 
      "title": "The Other Instrument"
    }


It fails if the instrument doesn't exist::

    >>> ctl('instrument-retrieve --project=rex.instrument_demo doesntexist', expect=1)
    FATAL ERROR: Instrument "doesntexist" does not exist.
    <BLANKLINE>


Or if the version doesn't exist::

    >>> ctl('instrument-retrieve --project=rex.instrument_demo simple --version=99', expect=1)
    FATAL ERROR: The desired version of "simple" does not exist.
    <BLANKLINE>


instrument-store
================

The ``instrument-store`` command will load a Common Instrument Definition JSON
to an InstrumentVersion in the project data store::

    >>> ctl('help instrument-store')
    INSTRUMENT-STORE - stores an InstrumentVersion in the data store
    Usage: rex instrument-store [<project>] <instrument-uid> <definition>
    <BLANKLINE>
    The instrument-store task will write a Common Instrument Definition JSON
    (or YAML) file to an InstrumentVersion in the project's data store.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument to use in
    the data store. If the UID does not already exist, a new Instrument will be
    created using that UID.
    <BLANKLINE>
    The definition is the path to the JSON file containing the Common
    Instrument Definition to use.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional parameter
      --set=PARAM=VALUE        : set a configuration parameter
      --version=VERSION        : the version to store the InstrumentVersion as; if not specified, one will be calculated
      --title=TITLE            : the title to give the Instrument, if one is being created; if not specified, the instrument UID will be used
      --published-by=NAME      : the name to record as the publisher of the InstrumentVersion; if not specified, the username of the executing user will be used
    <BLANKLINE>


It requires two arguments which are the UID of the Instrument and the path to
the file containing the JSON::

    >>> ctl('instrument-store', expect=1)
    FATAL ERROR: too few arguments for task instrument-store: missing <instrument-uid> <definition>
    <BLANKLINE>

    >>> ctl('instrument-store simple', expect=1)
    FATAL ERROR: too few arguments for task instrument-store: missing <definition>
    <BLANKLINE>

    >>> ctl('instrument-store --project=rex.instrument_demo complex ./test/instruments/simplest.json')
    Using Instrument: Complex Instrument
    Created version: 3

    >>> ctl('instrument-store --project=rex.instrument_demo complex ./test/instruments_yaml/simplest.yaml')
    Using Instrument: Complex Instrument
    Created version: 3


It takes a ``version`` option to specify which InstrumentVersion of the
Instrument to store the JSON as::

    >>> ctl('instrument-store --project=rex.instrument_demo complex ./test/instruments/simplest.json --version=1')
    Using Instrument: Complex Instrument
    ### SAVED INSTRUMENTVERSION complex1
    Updated version: 1

    >>> ctl('instrument-store --project=rex.instrument_demo complex ./test/instruments/simplest.json --version=99')
    Using Instrument: Complex Instrument
    Created version: 99


If you specify the UID of an Instrument that does not exist, it will be
created for you::

    >>> ctl('instrument-store --project=rex.instrument_demo doesntexist ./test/instruments/simplest.json')
    An Instrument by "doesntexist" does not exist; creating it.
    Using Instrument: doesntexist
    Created version: 1

