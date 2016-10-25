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
    The forms-validate task will validate the structure and content of the Web
    Form Configuration in a file and report back if any errors are found.
    <BLANKLINE>
    The configuration is the path to the file containing the Web Form
    Configuration to validate.
    <BLANKLINE>
    Options:
      --instrument=FILE        : the file containing the associated Instrument Definition; if not specified, then the Web Form Configuration will only be checked for schema violations
    <BLANKLINE>


It requires a single argument which is the path to the file::

    >>> ctl('forms-validate', expect=1)
    FATAL ERROR: too few arguments for task forms-validate: missing <configuration>
    <BLANKLINE>

    >>> ctl('forms-validate ./test/forms/simplest.json')
    "./test/forms/simplest.json" contains a valid Web Form Configuration.
    <BLANKLINE>

    >>> ctl('forms-validate ./test/forms/simplest.yaml')
    "./test/forms/simplest.yaml" contains a valid Web Form Configuration.
    <BLANKLINE>


You can optionally specify the file containing the corresponding Common
Instrument Definition, to ensure that the Form satisfies the Instrument::

    >>> ctl('forms-validate ./test/forms/simplest.json --instrument=./test/forms/instruments/test-instrument-1.1.json')
    "./test/forms/simplest.json" contains a valid Web Form Configuration.
    <BLANKLINE>

    >>> ctl('forms-validate ./test/forms/simplest.yaml --instrument=./test/forms/instruments/test-instrument-1.1.yaml')
    "./test/forms/simplest.yaml" contains a valid Web Form Configuration.
    <BLANKLINE>

    >>> ctl('forms-validate ./test/forms/simplest.json --instrument=./test/forms/instruments/test-instrument-1.1.yaml')
    "./test/forms/simplest.json" contains a valid Web Form Configuration.
    <BLANKLINE>

    >>> ctl('forms-validate ./test/forms/simplest.yaml --instrument=./test/forms/instruments/test-instrument-1.1.json')
    "./test/forms/simplest.yaml" contains a valid Web Form Configuration.
    <BLANKLINE>


It fails if the JSON structure violates the specification in any way::

    >>> ctl('forms-validate ./test/forms/missing_pages.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this Form:
    pages: Required
    <BLANKLINE>


Or if it doesn't satisfy the Instrument you specify::

    >>> ctl('forms-validate ./test/forms/simplest.json --instrument=./test/forms/instruments/test-instrument-1.2.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this Form:
    instrument: Incorrect Instrument version referenced
    <BLANKLINE>


Or if the files doesn't actually exist::

    >>> ctl('forms-validate /tmp/does/not/actually/exist.json', expect=1)
    FATAL ERROR: Could not open "/tmp/does/not/actually/exist.json": [Errno 2] No such file or directory: '/tmp/does/not/actually/exist.json'
    <BLANKLINE>

    >>> ctl('forms-validate ./test/forms/simplest.json --instrument=/tmp/does/not/actually/exist.json', expect=1)
    FATAL ERROR: Could not open "/tmp/does/not/actually/exist.json": [Errno 2] No such file or directory: '/tmp/does/not/actually/exist.json'
    <BLANKLINE>


forms-format
============

The ``forms-format`` command will format the specified configuration in the way
specified::

    >>> ctl('help forms-format')
    FORMS-FORMAT - render a Web Form Configuration into various formats
    Usage: rex forms-format <configuration>
    <BLANKLINE>
    The forms-format task will take an input Web Form Configuration file and
    output it as either JSON or YAML.
    <BLANKLINE>
    The configuration is the path to the file containing the Web Form
    Configuration to format.
    <BLANKLINE>
    Options:
      --output=OUTPUT_FILE     : the file to write to; if not specified, stdout is used
      --format=FORMAT          : the format to output the configuration in; can be either JSON or YAML; if not specified, defaults to JSON
      --pretty                 : if specified, the outputted configuration will be formatted with newlines and indentation
    <BLANKLINE>


It requires a single argument which is the path to the file::

    >>> ctl('forms-format', expect=1)
    FATAL ERROR: too few arguments for task forms-format: missing <configuration>
    <BLANKLINE>

    >>> ctl('forms-format ./test/forms/simplest.json')
    {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How do you feel today?"}}}]}]}

    >>> ctl('forms-format ./test/forms/simplest.yaml')
    {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How do you feel today?"}}}]}]}


It accepts options that dictate the various properties of the output format::

    >>> ctl('forms-format ./test/forms/simplest.json --format=YAML')
    instrument: {id: 'urn:test-instrument', version: '1.1'}
    defaultLocalization: en
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_fake
          text: {en: 'How do you feel today?'}

    >>> ctl('forms-format ./test/forms/simplest.yaml --format=YAML')
    instrument: {id: 'urn:test-instrument', version: '1.1'}
    defaultLocalization: en
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_fake
          text: {en: 'How do you feel today?'}

    >>> ctl('forms-format ./test/forms/simplest.json --format=JSON --pretty')
    {
      "instrument": {
        "id": "urn:test-instrument",
        "version": "1.1"
      },
      "defaultLocalization": "en",
      "pages": [
        {
          "id": "page1",
          "elements": [
            {
              "type": "question",
              "options": {
                "fieldId": "q_fake",
                "text": {
                  "en": "How do you feel today?"
                }
              }
            }
          ]
        }
      ]
    }

    >>> ctl('forms-format ./test/forms/simplest.json --format=YAML --pretty')
    instrument:
      id: urn:test-instrument
      version: '1.1'
    defaultLocalization: en
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_fake
          text:
            en: How do you feel today?


forms-retrieve
==============

The ``forms-retrieve`` command will retrieve the Web Form Configuration JSON
from a Form in the project data store::

    >>> ctl('help forms-retrieve')
    FORMS-RETRIEVE - retrieves a Form from the datastore
    Usage: rex forms-retrieve [<project>] <instrument-uid> <channel-uid>
    <BLANKLINE>
    The forms-retrieve task will retrieve a Form from a project's data store
    and return the Web Form Configuration.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument in the
    data store.
    <BLANKLINE>
    The channel-uid argument is the UID of the Channel that the Form is
    assigned to.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional package
      --set=PARAM=VALUE        : set a configuration parameter
      --output=OUTPUT_FILE     : the file to write to; if not specified, stdout is used
      --format=FORMAT          : the format to output the configuration in; can be either JSON or YAML; if not specified, defaults to JSON
      --pretty                 : if specified, the outputted configuration will be formatted with newlines and indentation
      --version=VERSION        : the version of the Instrument to retrieve; if not specified, defaults to the latest version
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
    {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "How do you feel today?"}}}]}]}


It takes a ``version`` option to specify which InstrumentVersion of the
Instrument to retrieve the Form for::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex survey')
    {"instrument": {"id": "urn:another-test-instrument", "version": "1.2"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_foo", "text": {"en": "How do you feel today?"}}}, {"type": "question", "options": {"fieldId": "q_bar", "text": {"en": "What is your favorite number?"}}}, {"type": "question", "options": {"fieldId": "q_baz", "text": {"en": "Is water wet?"}}}]}]}

    >>> ctl('forms-retrieve --project=rex.forms_demo complex survey --version=1')
    {"instrument": {"id": "urn:another-test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_foo", "text": {"en": "How do you feel today?"}}}, {"type": "question", "options": {"fieldId": "q_bar", "text": {"en": "What is your favorite number?"}}}]}]}


It can also print the JSON in a prettier way::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex survey --pretty')
    {
      "instrument": {
        "id": "urn:another-test-instrument",
        "version": "1.2"
      },
      "defaultLocalization": "en",
      "pages": [
        {
          "id": "page1",
          "elements": [
            {
              "type": "question",
              "options": {
                "fieldId": "q_foo",
                "text": {
                  "en": "How do you feel today?"
                }
              }
            },
            {
              "type": "question",
              "options": {
                "fieldId": "q_bar",
                "text": {
                  "en": "What is your favorite number?"
                }
              }
            },
            {
              "type": "question",
              "options": {
                "fieldId": "q_baz",
                "text": {
                  "en": "Is water wet?"
                }
              }
            }
          ]
        }
      ]
    }


It can also print the definition in YAML format::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex survey --pretty --format=YAML')
    instrument:
      id: urn:another-test-instrument
      version: '1.2'
    defaultLocalization: en
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_foo
          text:
            en: How do you feel today?
      - type: question
        options:
          fieldId: q_bar
          text:
            en: What is your favorite number?
      - type: question
        options:
          fieldId: q_baz
          text:
            en: Is water wet?


It fails if the instrument doesn't exist::

    >>> ctl('forms-retrieve --project=rex.forms_demo doesntexist survey', expect=1)
    FATAL ERROR: Instrument "doesntexist" does not exist.
    <BLANKLINE>


Or if the channel doesn't exist::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex doesntexist', expect=1)
    FATAL ERROR: Channel "doesntexist" does not exist.
    <BLANKLINE>


Or if the channel is not a form-based channel::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex mobile', expect=1)
    FATAL ERROR: Channel "mobile" is not a web form channel.
    <BLANKLINE>


Or if the combination of instrument and channel doesn't exist::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex entry', expect=1)
    FATAL ERROR: No Form exists for Instrument "complex", Version 2, Channel "entry"
    <BLANKLINE>


Or if the version doesn't exist::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex survey --version=99', expect=1)
    FATAL ERROR: The desired version of "complex" does not exist.
    <BLANKLINE>


Or if you specify a bogus format::

    >>> ctl('forms-retrieve --project=rex.forms_demo complex survey --pretty --format=XML', expect=1)
    FATAL ERROR: invalid value for option --format: Invalid format type "XML" specified
    <BLANKLINE>


forms-store
===========

The ``forms-store`` command will load a Web Form Configuration JSON to a Form
in the project data store::

    >>> ctl('help forms-store')
    FORMS-STORE - stores a Form in the data store
    Usage: rex forms-store [<project>] <instrument-uid> <channel-uid> <configuration>
    <BLANKLINE>
    The forms-store task will write a Web Form Configuration file to a Form in
    the project's data store.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument that the
    Form will be associated with.
    <BLANKLINE>
    The channel-uid argument is the UID of the Channel that the Form will be
    associated with.
    <BLANKLINE>
    The configuration is the path to the file containing the Web Form
    Configuration to use.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional package
      --set=PARAM=VALUE        : set a configuration parameter
      --context=PARAM=VALUE    : the additional parameters to pass to the RexAcquire API implementations to create/save objects to the data store
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

    >>> ctl('forms-store --project=rex.forms_demo simple survey ./test/forms/simplest.yaml')
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


Or if the channel is not a form-based channel::

    >>> ctl('forms-store --project=rex.forms_demo simple mobile ./test/forms/simplest.json', expect=1)
    Using Instrument: Simple Instrument
    Instrument Version: 1
    FATAL ERROR: Channel "mobile" is not a web form channel.
    <BLANKLINE>


If the combination of instrument/version and channel doesn't exist, a new Form
will be created::

    >>> ctl('forms-store --project=rex.forms_demo simple fake ./test/forms/simplest.json')
    Using Instrument: Simple Instrument
    Instrument Version: 1
    Using Channel: FakeChannel
    Created new Form


Or if the version doesn't exist::

    >>> ctl('forms-store --project=rex.forms_demo simple survey ./test/forms/simplest.json --version=99', expect=1)
    Using Instrument: Simple Instrument
    FATAL ERROR: The desired version of "simple" does not exist.
    <BLANKLINE>


instrument-formskeleton
=======================

The ``instrument-formskeleton`` command will generate a basic Web Form
Configuration from an Instrument Definintion::

    >>> ctl('help instrument-formskeleton')
    INSTRUMENT-FORMSKELETON - generate a basic Web Form Configuration from an Instrument Definintion
    Usage: rex instrument-formskeleton <definition>
    <BLANKLINE>
    The only argument to this task is the filename of the Instrument.
    <BLANKLINE>
    Options:
      --output=OUTPUT_FILE     : the file to write to; if not specified, stdout is used
      --format=FORMAT          : the format to output the configuration in; can be either JSON or YAML; if not specified, defaults to JSON
      --pretty                 : if specified, the outputted configuration will be formatted with newlines and indentation
      --localization=LOCALE    : the locale to use as the default localization; if not specified, defaults to "en"
    <BLANKLINE>


It requires one argument, path to the instrument file in json or yaml format::

    >>> ctl('instrument-formskeleton', expect=1)
    FATAL ERROR: too few arguments for task instrument-formskeleton: missing <definition>
    <BLANKLINE>

    >>> ctl('instrument-formskeleton ./test/forms/instruments/test-instrument-1.1.json')
    {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "title": {"en": "The InstrumentVersion Title"}, "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "q_fake"}}}]}]}

    >>> ctl('instrument-formskeleton ./test/forms/instruments/simplest.yaml')
    {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "title": {"en": "The InstrumentVersion Title"}, "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "q_fake"}}}]}]}


It accepts options that dictate the various properties of the output format::

    >>> ctl('instrument-formskeleton ./test/forms/instruments/test-instrument-1.1.json --pretty')
    {
      "instrument": {
        "id": "urn:test-instrument",
        "version": "1.1"
      },
      "defaultLocalization": "en",
      "title": {
        "en": "The InstrumentVersion Title"
      },
      "pages": [
        {
          "id": "page1",
          "elements": [
            {
              "type": "question",
              "options": {
                "fieldId": "q_fake",
                "text": {
                  "en": "q_fake"
                }
              }
            }
          ]
        }
      ]
    }

    >>> ctl('instrument-formskeleton ./test/forms/instruments/test-instrument-1.1.json --format=YAML')
    instrument: {id: 'urn:test-instrument', version: '1.1'}
    defaultLocalization: en
    title: {en: The InstrumentVersion Title}
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_fake
          text: {en: q_fake}

    >>> ctl('instrument-formskeleton ./test/forms/instruments/simplest.yaml --format=YAML')
    instrument: {id: 'urn:test-instrument', version: '1.1'}
    defaultLocalization: en
    title: {en: The InstrumentVersion Title}
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_fake
          text: {en: q_fake}

    >>> ctl('instrument-formskeleton ./test/forms/instruments/constraint_enumerations.json --pretty --format=YAML')
    instrument:
      id: urn:test-instrument
      version: '1.1'
    defaultLocalization: en
    title:
      en: The InstrumentVersion Title
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_enumeration
          text:
            en: q_enumeration
          enumerations:
          - id: foo
            text:
              en: foo
      - type: question
        options:
          fieldId: q_enumerationset
          text:
            en: q_enumerationset
          enumerations:
          - id: bar
            text:
              en: bar
          - id: foo
            text:
              en: foo

    >>> ctl('instrument-formskeleton ./test/forms/instruments/constraint_enumerations_null.json --pretty --format=YAML')
    instrument:
      id: urn:test-instrument
      version: '1.1'
    defaultLocalization: en
    title:
      en: The InstrumentVersion Title
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_enumeration
          text:
            en: q_enumeration
          enumerations:
          - id: foo
            text:
              en: Foo!
      - type: question
        options:
          fieldId: q_enumerationset
          text:
            en: q_enumerationset
          enumerations:
          - id: bar
            text:
              en: bar
          - id: foo
            text:
              en: foo

    >>> ctl('instrument-formskeleton ./test/forms/instruments/matrix.json --pretty --format=YAML')
    instrument:
      id: urn:test-instrument
      version: '1.1'
    defaultLocalization: en
    title:
      en: The InstrumentVersion Title
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_fake
          text:
            en: q_fake
          questions:
          - fieldId: blah
            text:
              en: blah
          - fieldId: foobar
            text:
              en: foobar
          rows:
          - id: somerow
            text:
              en: somerow

    >>> ctl('instrument-formskeleton ./test/forms/instruments/recordlist.json --pretty --format=YAML')
    instrument:
      id: urn:test-instrument
      version: '1.1'
    defaultLocalization: en
    title:
      en: The InstrumentVersion Title
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_fake
          text:
            en: q_fake
          questions:
          - fieldId: quest1
            text:
              en: quest1
          - fieldId: quest2
            text:
              en: quest2

    >>> ctl('instrument-formskeleton ./test/forms/instruments/types_extend.json --pretty --format=YAML')
    instrument:
      id: urn:test-instrument
      version: '1.1'
    defaultLocalization: en
    title:
      en: The InstrumentVersion Title
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_blah
          text:
            en: q_blah
      - type: question
        options:
          fieldId: q_happy
          text:
            en: q_happy

    >>> ctl('instrument-formskeleton ./test/forms/instruments/constraint_enumerations_numeric.json --pretty --format=YAML')
    instrument:
      id: urn:test-instrument
      version: '1.1'
    defaultLocalization: en
    title:
      en: Some Enumerations
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_enumeration
          text:
            en: q_enumeration
          enumerations:
          - id: '0'
            text:
              en: '0'
          - id: '1'
            text:
              en: '1'
          - id: '2'
            text:
              en: '2'
          widget:
            type: radioGroup
            options:
              hotkeys:
                '0': '0'
                '1': '1'
                '2': '2'
      - type: question
        options:
          fieldId: q_enumerationset
          text:
            en: q_enumerationset
          enumerations:
          - id: '0'
            text:
              en: '0'
          - id: '1'
            text:
              en: '1'
          - id: '2'
            text:
              en: '2'
          widget:
            type: checkGroup
            options:
              hotkeys:
                '0': '0'
                '1': '1'
                '2': '2'
      - type: question
        options:
          fieldId: q_enumeration2
          text:
            en: q_enumeration2
          enumerations:
          - id: '1'
            text:
              en: '1'
          - id: bar
            text:
              en: bar
          - id: foo
            text:
              en: foo

