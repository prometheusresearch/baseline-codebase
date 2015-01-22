****************
REX.CTL Commands
****************

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.ctl import ctl


forms-validate
==============

The ``forms-validate`` command will validate the structure of a JSON file
against the Web Form Configuration specification::

    >>> ctl('help forms-validate')
    FORMS-VALIDATE - validate a Web Form Configuration
    Usage: rex forms-validate <configuration>
    <BLANKLINE>
    The forms-validate task will validate the structure and content of the
    Web Form Configuration in a JSON (or YAML) file and report back if any
    errors are found.
    <BLANKLINE>
    The only argument to this task is the filename to validate.
    <BLANKLINE>
    Options:
      --instrument=FILE        : the file containing the associated Instrument Definition JSON (or YAML); if not specified, then the Web Form Configuration will only be checked for schema violations
    <BLANKLINE>


It requires a single argument which is the path to the file::

    >>> ctl('forms-validate', expect=1)
    FATAL ERROR: too few arguments for task forms-validate: missing <configuration>
    <BLANKLINE>

    >>> ctl('forms-validate ./test/forms/simplest.json')
    "./test/forms/simplest.json" contains a valid Web Form Configuration.
    <BLANKLINE>

    >>> ctl('forms-validate ./test/forms_yaml/simplest.yaml')
    "./test/forms_yaml/simplest.yaml" contains a valid Web Form Configuration.
    <BLANKLINE>


You can optionally specify the file containing the corresponding Common
Instrument Definition, to ensure that the Form satisfies the Instrument::

    >>> ctl('forms-validate ./test/forms/simplest.json --instrument=./test/forms/instruments/test-instrument-1.1.json')
    "./test/forms/simplest.json" contains a valid Web Form Configuration.
    <BLANKLINE>

    >>> ctl('forms-validate ./test/forms_yaml/simplest.yaml --instrument=./test/forms_yaml/instruments/test-instrument-1.1.yaml')
    "./test/forms_yaml/simplest.yaml" contains a valid Web Form Configuration.
    <BLANKLINE>

    >>> ctl('forms-validate ./test/forms/simplest.json --instrument=./test/forms_yaml/instruments/test-instrument-1.1.yaml')
    "./test/forms/simplest.json" contains a valid Web Form Configuration.
    <BLANKLINE>

    >>> ctl('forms-validate ./test/forms_yaml/simplest.yaml --instrument=./test/forms/instruments/test-instrument-1.1.json')
    "./test/forms_yaml/simplest.yaml" contains a valid Web Form Configuration.
    <BLANKLINE>


It fails if the JSON structure violates the specification in any way::

    >>> ctl('forms-validate ./test/forms/missing_pages.json', expect=1)
    FATAL ERROR: u'pages' is a required property
    <BLANKLINE>


Or if it doesn't satisfy the Instrument you specify::

    >>> ctl('forms-validate ./test/forms/simplest.json --instrument=./test/forms/instruments/test-instrument-1.2.json', expect=1)
    FATAL ERROR: There are fields which have not be used: q_foobar
    <BLANKLINE>


Or if the files doesn't actually exist::

    >>> ctl('forms-validate /tmp/does/not/actually/exist.json', expect=1)
    FATAL ERROR: Could not open "/tmp/does/not/actually/exist.json": [Errno 2] No such file or directory: '/tmp/does/not/actually/exist.json'
    <BLANKLINE>

    >>> ctl('forms-validate ./test/forms/simplest.json --instrument=/tmp/does/not/actually/exist.json', expect=1)
    FATAL ERROR: Could not open "/tmp/does/not/actually/exist.json": [Errno 2] No such file or directory: '/tmp/does/not/actually/exist.json'
    <BLANKLINE>


forms-retrieve
==============

The ``forms-retrieve`` command will retrieve the Web Form Configuration JSON
from a Form in the project data store::

    >>> ctl('help forms-retrieve')
    FORMS-RETRIEVE - retrieves a Form from the datastore
    Usage: rex forms-retrieve [<project>] <instrument-uid> <channel-uid>
    <BLANKLINE>
    The forms-retrieve task will retrieve a Form from a project's data store
    and return the Web Form Configuration JSON.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument in the
    data store.
    <BLANKLINE>
    The channel-uid argument is the UID of the Channel that the Form is
    assigned to.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional parameter
      --set=PARAM=VALUE        : set a configuration parameter
      --version=VERSION        : the version of the Instrument to retrieve; if not specified, defaults to the latest version
      --output=OUTPUT_FILE     : the file to write the JSON to; if not specified, stdout is used
      --pretty                 : if specified, the outputted JSON will be formatted with newlines and indentation
    <BLANKLINE>

It requires two arguments which are the UID of the Instrument and UID of the
Channel::

    >>> ctl('forms-retrieve', expect=1)
    FATAL ERROR: too few arguments for task forms-retrieve: missing <instrument-uid> <channel-uid>
    <BLANKLINE>

    >>> ctl('forms-retrieve simple', expect=1)
    FATAL ERROR: too few arguments for task forms-retrieve: missing <channel-uid>
    <BLANKLINE>

    >>> ctl('forms-retrieve --project=rex.forms_demo simple survey')
    {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How do you feel today?"}, "fieldId": "q_fake"}}], "id": "page1"}]}


It takes a ``version`` option to specify which InstrumentVersion of the
Instrument to retrieve the Form for::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex survey')
    {"instrument": {"version": "1.2", "id": "urn:another-test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How do you feel today?"}, "fieldId": "q_foo"}}, {"type": "question", "options": {"text": {"en": "What is your favorite number?"}, "fieldId": "q_bar"}}, {"type": "question", "options": {"text": {"en": "Is water wet?"}, "fieldId": "q_baz"}}], "id": "page1"}]}

    >>> ctl('forms-retrieve --project=rex.forms_demo complex survey --version=1')
    {"instrument": {"version": "1.1", "id": "urn:another-test-instrument"}, "defaultLocalization": "en", "pages": [{"elements": [{"type": "question", "options": {"text": {"en": "How do you feel today?"}, "fieldId": "q_foo"}}, {"type": "question", "options": {"text": {"en": "What is your favorite number?"}, "fieldId": "q_bar"}}], "id": "page1"}]}


It can also print the JSON in a prettier way::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex survey --pretty')
    {
      "instrument": {
        "version": "1.2", 
        "id": "urn:another-test-instrument"
      }, 
      "defaultLocalization": "en", 
      "pages": [
        {
          "elements": [
            {
              "type": "question", 
              "options": {
                "text": {
                  "en": "How do you feel today?"
                }, 
                "fieldId": "q_foo"
              }
            }, 
            {
              "type": "question", 
              "options": {
                "text": {
                  "en": "What is your favorite number?"
                }, 
                "fieldId": "q_bar"
              }
            }, 
            {
              "type": "question", 
              "options": {
                "text": {
                  "en": "Is water wet?"
                }, 
                "fieldId": "q_baz"
              }
            }
          ], 
          "id": "page1"
        }
      ]
    }


It fails if the instrument doesn't exist::

    >>> ctl('forms-retrieve --project=rex.forms_demo doesntexist survey', expect=1)
    FATAL ERROR: Instrument "doesntexist" does not exist.
    <BLANKLINE>


Or if the channel doesn't exist::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex doesntexist', expect=1)
    FATAL ERROR: Channel "doesntexist" does not exist.
    <BLANKLINE>


Or if the combination of instrument and channel doesn't exist::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex entry', expect=1)
    FATAL ERROR: No Form exists for Instrument "complex", Version 2, Channel "entry"
    <BLANKLINE>


Or if the version doesn't exist::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex survey --version=99', expect=1)
    FATAL ERROR: The desired version of "complex" does not exist.
    <BLANKLINE>


forms-store
===========

The ``forms-store`` command will load a Web Form Configuration JSON to a Form
in the project data store::

    >>> ctl('help forms-store')
    FORMS-STORE - stores a Form in the data store
    Usage: rex forms-store [<project>] <instrument-uid> <channel-uid> <configuration>
    <BLANKLINE>
    The forms-store task will write a Web Form Configuration JSON (or YAML)
    file to a Form in the project's data store.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument that the
    Form will be associated with.
    <BLANKLINE>
    The channel-uid argument is the UID of the Channel that the Form will be
    associated with.
    <BLANKLINE>
    The configuration is the path to the JSON/YAML file containing the Web Form
    Configuration to use.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional parameter
      --set=PARAM=VALUE        : set a configuration parameter
      --version=VERSION        : the version of the Instrument to associate the Form with; if not specified, then the latest version will be used
    <BLANKLINE>


It requires three arguments; the UID of the Instrument, the UID of the Channel,
and the path to the file containing the JSON::

    >>> ctl('forms-store', expect=1)
    FATAL ERROR: too few arguments for task forms-store: missing <instrument-uid> <channel-uid> <configuration>
    <BLANKLINE>

    >>> ctl('forms-store simple', expect=1)
    FATAL ERROR: too few arguments for task forms-store: missing <channel-uid> <configuration>
    <BLANKLINE>

    >>> ctl('forms-store simple survey', expect=1)
    FATAL ERROR: too few arguments for task forms-store: missing <configuration>
    <BLANKLINE>

    >>> ctl('forms-store --project=rex.forms_demo simple survey ./test/forms/simplest.json')
    Using Instrument: Simple Instrument
    Instrument Version: 1
    Using Channel: RexSurvey
    ### SAVED FORM simple1survey
    Updated existing Form

    >>> ctl('forms-store --project=rex.forms_demo simple survey ./test/forms_yaml/simplest.yaml')
    Using Instrument: Simple Instrument
    Instrument Version: 1
    Using Channel: RexSurvey
    ### SAVED FORM simple1survey
    Updated existing Form


It fails if the instrument doesn't exist::

    >>> ctl('forms-store --project=rex.forms_demo doesntexist survey ./test/forms/simplest.json', expect=1)
    FATAL ERROR: Instrument "doesntexist" does not exist.
    <BLANKLINE>


Or if the channel doesn't exist::

    >>> ctl('forms-store --project=rex.forms_demo simple doesntexist ./test/forms/simplest.json', expect=1)
    Using Instrument: Simple Instrument
    Instrument Version: 1
    FATAL ERROR: Channel "doesntexist" does not exist.
    <BLANKLINE>


If the combination of instrument/version and channel doesn't exist, a new Form
will be created::

    >>> ctl('forms-store --project=rex.forms_demo simple fake ./test/forms/simplest.json')
    Using Instrument: Simple Instrument
    Instrument Version: 1
    Using Channel: FakeChannel
    Created new Form


Or if the version doesn't exist::

    >>> ctl('forms-retrieve --project=rex.forms_demo simple survey --version=99', expect=1)
    FATAL ERROR: The desired version of "simple" does not exist.
    <BLANKLINE>

