****************
REX.CTL Commands
****************

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.ctl import ctl


mobile-validate
===============

The ``mobile-validate`` command will validate the structure of a JSON file
against the Web Form Configuration specification::

    >>> ctl('help mobile-validate')
    MOBILE-VALIDATE - validate an SMS Interaction Configuration
    Usage: rex mobile-validate <configuration>
    <BLANKLINE>
    The mobile-validate task will validate the structure and content of the SMS
    Interaction Configuration in a file and report back if any errors are
    found.
    <BLANKLINE>
    The configuration is the path to the file containing the SMS Interaction
    Configuration to validate.
    <BLANKLINE>
    Options:
      --instrument=FILE        : the file containing the associated Instrument Definition; if not specified, then the SMS Interaction Configuration will only be checked for schema violations
    <BLANKLINE>


It requires a single argument which is the path to the file::

    >>> ctl('mobile-validate', expect=1)
    FATAL ERROR: too few arguments for task mobile-validate: missing <configuration>
    <BLANKLINE>

    >>> ctl('mobile-validate ./test/interactions/simplest.json')
    "./test/interactions/simplest.json" contains a valid SMS Interaction Configuration.
    <BLANKLINE>

    >>> ctl('mobile-validate ./test/interactions/simplest.yaml')
    "./test/interactions/simplest.yaml" contains a valid SMS Interaction Configuration.
    <BLANKLINE>


You can optionally specify the file containing the corresponding Common
Instrument Definition, to ensure that the Interaction satisfies the
Instrument::

    >>> ctl('mobile-validate ./test/interactions/simplest.json --instrument=./test/interactions/instruments/test-instrument-1.1.json')
    "./test/interactions/simplest.json" contains a valid SMS Interaction Configuration.
    <BLANKLINE>

    >>> ctl('mobile-validate ./test/interactions/simplest.yaml --instrument=./test/interactions/instruments/test-instrument-1.1.yaml')
    "./test/interactions/simplest.yaml" contains a valid SMS Interaction Configuration.
    <BLANKLINE>

    >>> ctl('mobile-validate ./test/interactions/simplest.json --instrument=./test/interactions/instruments/test-instrument-1.1.yaml')
    "./test/interactions/simplest.json" contains a valid SMS Interaction Configuration.
    <BLANKLINE>

    >>> ctl('mobile-validate ./test/interactions/simplest.yaml --instrument=./test/interactions/instruments/test-instrument-1.1.json')
    "./test/interactions/simplest.yaml" contains a valid SMS Interaction Configuration.
    <BLANKLINE>


It fails if the JSON structure violates the specification in any way::

    >>> ctl('mobile-validate ./test/interactions/missing_steps.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this Interaction:
    steps: Required
    <BLANKLINE>


Or if it doesn't satisfy the Instrument you specify::

    >>> ctl('mobile-validate ./test/interactions/simplest.json --instrument=./test/interactions/instruments/test-instrument-1.2.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this Interaction:
    instrument: Incorrect Instrument version referenced
    <BLANKLINE>


Or if the files doesn't actually exist::

    >>> ctl('mobile-validate /tmp/does/not/actually/exist.json', expect=1)
    FATAL ERROR: Could not open "/tmp/does/not/actually/exist.json": [Errno 2] No such file or directory: '/tmp/does/not/actually/exist.json'
    <BLANKLINE>

    >>> ctl('mobile-validate ./test/interactions/simplest.json --instrument=/tmp/does/not/actually/exist.json', expect=1)
    FATAL ERROR: Could not open "/tmp/does/not/actually/exist.json": [Errno 2] No such file or directory: '/tmp/does/not/actually/exist.json'
    <BLANKLINE>


mobile-format
=============

The ``mobile-format`` command will format the specified configuration in the way
specified::

    >>> ctl('help mobile-format')
    MOBILE-FORMAT - render an SMS Interaction Configuration into various formats
    Usage: rex mobile-format <configuration>
    <BLANKLINE>
    The mobile-format task will take an input SMS Interaction Configuration
    file and output it as either JSON or YAML.
    <BLANKLINE>
    The configuration is the path to the file containing the SMS Interaction
    Configuration to format.
    <BLANKLINE>
    Options:
      --output=OUTPUT_FILE     : the file to write to; if not specified, stdout is used
      --format=FORMAT          : the format to output the configuration in; can be either JSON or YAML; if not specified, defaults to JSON
      --pretty                 : if specified, the outputted configuration will be formatted with newlines and indentation
    <BLANKLINE>


It requires a single argument which is the path to the file::

    >>> ctl('mobile-format', expect=1)
    FATAL ERROR: too few arguments for task mobile-format: missing <configuration>
    <BLANKLINE>

    >>> ctl('mobile-format ./test/interactions/simplest.json')
    {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "steps": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "Fake question"}}}]}

    >>> ctl('mobile-format ./test/interactions/simplest.yaml')
    {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "steps": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "Fake question"}}}]}


It accepts options that dictate the various properties of the output format::

    >>> ctl('mobile-format ./test/interactions/simplest.json --format=YAML')
    instrument: {id: 'urn:test-instrument', version: '1.1'}
    defaultLocalization: en
    steps:
    - type: question
      options:
        fieldId: q_fake
        text: {en: Fake question}

    >>> ctl('mobile-format ./test/interactions/simplest.yaml --format=YAML')
    instrument: {id: 'urn:test-instrument', version: '1.1'}
    defaultLocalization: en
    steps:
    - type: question
      options:
        fieldId: q_fake
        text: {en: Fake question}

    >>> ctl('mobile-format ./test/interactions/simplest.json --format=JSON --pretty')
    {
      "instrument": {
        "id": "urn:test-instrument",
        "version": "1.1"
      },
      "defaultLocalization": "en",
      "steps": [
        {
          "type": "question",
          "options": {
            "fieldId": "q_fake",
            "text": {
              "en": "Fake question"
            }
          }
        }
      ]
    }

    >>> ctl('mobile-format ./test/interactions/simplest.json --format=YAML --pretty')
    instrument:
      id: urn:test-instrument
      version: '1.1'
    defaultLocalization: en
    steps:
    - type: question
      options:
        fieldId: q_fake
        text:
          en: Fake question


mobile-retrieve
===============

The ``mobile-retrieve`` command will retrieve the SMS Interaction Configuration
JSON from a Form in the project data store::

    >>> ctl('help mobile-retrieve')
    MOBILE-RETRIEVE - retrieves an Interaction from the datastore
    Usage: rex mobile-retrieve [<project>] <instrument-uid> <channel-uid>
    <BLANKLINE>
    The mobile-retrieve task will retrieve an Interaction from a project's data
    store and return the SMS Interaction Configuration.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument in the
    data store.
    <BLANKLINE>
    The channel-uid argument is the UID of the Channel that the Interaction is
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

    >>> ctl('mobile-retrieve', expect=1)
    FATAL ERROR: too few arguments for task mobile-retrieve: missing <instrument-uid> <channel-uid>
    <BLANKLINE>

    >>> ctl('mobile-retrieve simple', expect=1)
    FATAL ERROR: too few arguments for task mobile-retrieve: missing <channel-uid>
    <BLANKLINE>

    >>> ctl('mobile-retrieve --project=rex.mobile_demo simple mobile')
    {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "steps": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "Question1"}}}]}


It takes a ``version`` option to specify which InstrumentVersion of the
Instrument to retrieve the Form for::

    >>> ctl('mobile-retrieve --project=rex.mobile_demo complex mobile')
    {"instrument": {"id": "urn:another-test-instrument", "version": "1.2"}, "defaultLocalization": "en", "steps": [{"type": "question", "options": {"fieldId": "q_foo", "text": {"en": "Question1"}}}, {"type": "question", "options": {"fieldId": "q_bar", "text": {"en": "Question2"}}}, {"type": "question", "options": {"fieldId": "q_baz", "text": {"en": "Question3"}}}]}

    >>> ctl('mobile-retrieve --project=rex.mobile_demo complex mobile --version=1')
    {"instrument": {"id": "urn:another-test-instrument", "version": "1.1"}, "defaultLocalization": "en", "steps": [{"type": "question", "options": {"fieldId": "q_foo", "text": {"en": "Question1"}}}, {"type": "question", "options": {"fieldId": "q_bar", "text": {"en": "Question2"}}}]}


It can also print the JSON in a prettier way::

    >>> ctl('mobile-retrieve --project=rex.mobile_demo complex mobile --pretty')
    {
      "instrument": {
        "id": "urn:another-test-instrument",
        "version": "1.2"
      },
      "defaultLocalization": "en",
      "steps": [
        {
          "type": "question",
          "options": {
            "fieldId": "q_foo",
            "text": {
              "en": "Question1"
            }
          }
        },
        {
          "type": "question",
          "options": {
            "fieldId": "q_bar",
            "text": {
              "en": "Question2"
            }
          }
        },
        {
          "type": "question",
          "options": {
            "fieldId": "q_baz",
            "text": {
              "en": "Question3"
            }
          }
        }
      ]
    }


It can also print the definition in YAML format::

    >>> ctl('mobile-retrieve --project=rex.mobile_demo complex mobile --pretty --format=YAML')
    instrument:
      id: urn:another-test-instrument
      version: '1.2'
    defaultLocalization: en
    steps:
    - type: question
      options:
        fieldId: q_foo
        text:
          en: Question1
    - type: question
      options:
        fieldId: q_bar
        text:
          en: Question2
    - type: question
      options:
        fieldId: q_baz
        text:
          en: Question3


It fails if the instrument doesn't exist::

    >>> ctl('mobile-retrieve --project=rex.mobile_demo doesntexist mobile', expect=1)
    FATAL ERROR: Instrument "doesntexist" does not exist.
    <BLANKLINE>


Or if the channel doesn't exist::

    >>> ctl('mobile-retrieve --project=rex.mobile_demo complex doesntexist', expect=1)
    FATAL ERROR: Channel "doesntexist" does not exist.
    <BLANKLINE>


Or if the combination of instrument and channel doesn't exist::

    >>> ctl('mobile-retrieve --project=rex.mobile_demo disabled mobile', expect=1)
    FATAL ERROR: No Interaction exists for Instrument "disabled", Version 1, Channel "mobile"
    <BLANKLINE>


Or if the channel specified doesn't support SMS::

    >>> ctl('mobile-retrieve --project=rex.mobile_demo simple survey', expect=1)
    FATAL ERROR: Channel "survey" is not a mobile channel.
    <BLANKLINE>

Or if the version doesn't exist::

    >>> ctl('mobile-retrieve --project=rex.mobile_demo complex mobile --version=99', expect=1)
    FATAL ERROR: The desired version of "complex" does not exist.
    <BLANKLINE>


Or if you specify a bogus format::

    >>> ctl('mobile-retrieve --project=rex.mobile_demo complex mobile --pretty --format=XML', expect=1)
    FATAL ERROR: invalid value for option --format: Invalid format type "XML" specified
    <BLANKLINE>


mobile-store
============

The ``mobile-store`` command will load an SMS Interaction Configuration JSON to
a Form in the project data store::

    >>> ctl('help mobile-store')
    MOBILE-STORE - stores an Interaction in the data store
    Usage: rex mobile-store [<project>] <instrument-uid> <channel-uid> <configuration>
    <BLANKLINE>
    The mobile-store task will write an SMS Interaction Configuration file to
    an Interaction in the project's data store.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument that the
    Interaction will be associated with.
    <BLANKLINE>
    The channel-uid argument is the UID of the Channel that the Interaction
    will be associated with.
    <BLANKLINE>
    The configuration is the path to the file containing the SMS Interaction
    Configuration to use.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional package
      --set=PARAM=VALUE        : set a configuration parameter
      --context=PARAM=VALUE    : the additional parameters to pass to the RexAcquire API implementations to create/save objects to the data store
      --version=VERSION        : the version of the Instrument to associate the Interaction with; if not specified, then the latest version will be used
    <BLANKLINE>


It requires three arguments; the UID of the Instrument, the UID of the Channel,
and the path to the file containing the JSON::

    >>> ctl('mobile-store', expect=1)
    FATAL ERROR: too few arguments for task mobile-store: missing <instrument-uid> <channel-uid> <configuration>
    <BLANKLINE>

    >>> ctl('mobile-store simple', expect=1)
    FATAL ERROR: too few arguments for task mobile-store: missing <channel-uid> <configuration>
    <BLANKLINE>

    >>> ctl('mobile-store simple survey', expect=1)
    FATAL ERROR: too few arguments for task mobile-store: missing <configuration>
    <BLANKLINE>

    >>> ctl('mobile-store --project=rex.mobile_demo simple mobile ./test/interactions/simplest.json')
    Using Instrument: Simple Instrument
    Instrument Version: 1
    Using Channel: RexMobile
    ### SAVED INTERACTION simple1mobile
    Updated existing Interaction

    >>> ctl('mobile-store --project=rex.mobile_demo simple mobile ./test/interactions/simplest.yaml')
    Using Instrument: Simple Instrument
    Instrument Version: 1
    Using Channel: RexMobile
    ### SAVED INTERACTION simple1mobile
    Updated existing Interaction


It fails if the instrument doesn't exist::

    >>> ctl('mobile-store --project=rex.mobile_demo doesntexist mobile ./test/interactions/simplest.json', expect=1)
    FATAL ERROR: Instrument "doesntexist" does not exist.
    <BLANKLINE>


Or if the channel doesn't exist::

    >>> ctl('mobile-store --project=rex.mobile_demo simple doesntexist ./test/interactions/simplest.json', expect=1)
    Using Instrument: Simple Instrument
    Instrument Version: 1
    FATAL ERROR: Channel "doesntexist" does not exist.
    <BLANKLINE>


Or if the channel specified doesn't support SMS::

    >>> ctl('mobile-store --project=rex.mobile_demo simple survey ./test/interactions/simplest.json', expect=1)
    Using Instrument: Simple Instrument
    Instrument Version: 1
    FATAL ERROR: Channel "survey" is not a mobile channel.
    <BLANKLINE>


If the combination of instrument/version and channel doesn't exist, a new
Interaction will be created::

    >>> ctl('mobile-store --project=rex.mobile_demo simple fakesms ./test/interactions/simplest.json')
    Using Instrument: Simple Instrument
    Instrument Version: 1
    Using Channel: FakeSmsChannel
    Created new Interaction


Or if the version doesn't exist::

    >>> ctl('mobile-store --project=rex.mobile_demo simple mobile ./test/interactions/simplest.json --version=99', expect=1)
    Using Instrument: Simple Instrument
    FATAL ERROR: The desired version of "simple" does not exist.
    <BLANKLINE>


instrument-mobileskeleton
=========================

The ``instrument-mobileskeleton`` command will generate a basic SMS Interaction
Configuration from an Instrument Definintion::

    >>> ctl('help instrument-mobileskeleton')
    INSTRUMENT-MOBILESKELETON - generate a basic SMS Interaction Configuration from an Instrument
    Usage: rex instrument-mobileskeleton <definition>
    <BLANKLINE>
    Definintion
    <BLANKLINE>
    The only argument to this task is the filename of the Instrument.
    <BLANKLINE>
    Options:
      --output=OUTPUT_FILE     : the file to write to; if not specified, stdout is used
      --format=FORMAT          : the format to output the configuration in; can be either JSON or YAML; if not specified, defaults to JSON
      --pretty                 : if specified, the outputted configuration will be formatted with newlines and indentation
      --localization=LOCALE    : the locale to use as the default localization; if not specified, defaults to "en"
    <BLANKLINE>


It requires one argument, path to the instrument file in JSON or YAML format::

    >>> ctl('instrument-mobileskeleton', expect=1)
    FATAL ERROR: too few arguments for task instrument-mobileskeleton: missing <definition>
    <BLANKLINE>

    >>> ctl('instrument-mobileskeleton ./test/interactions/instruments/test-instrument-1.1.json')
    {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "steps": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "q_fake"}}}]}

    >>> ctl('instrument-mobileskeleton ./test/interactions/instruments/test-instrument-1.1.yaml')
    {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "steps": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "q_fake"}}}]}


It accepts options that dictate the various properties of the output format::

    >>> ctl('instrument-mobileskeleton ./test/interactions/instruments/test-instrument-1.1.json --pretty')
    {
      "instrument": {
        "id": "urn:test-instrument",
        "version": "1.1"
      },
      "defaultLocalization": "en",
      "steps": [
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

    >>> ctl('instrument-mobileskeleton ./test/interactions/instruments/test-instrument-1.1.json --format=yaml')
    instrument: {id: 'urn:test-instrument', version: '1.1'}
    defaultLocalization: en
    steps:
    - type: question
      options:
        fieldId: q_fake
        text: {en: q_fake}

    >>> ctl('instrument-mobileskeleton ./test/interactions/instruments/test-instrument-1.1.json --format=yaml --pretty')
    instrument:
      id: urn:test-instrument
      version: '1.1'
    defaultLocalization: en
    steps:
    - type: question
      options:
        fieldId: q_fake
        text:
          en: q_fake

    >>> ctl('instrument-mobileskeleton ./test/interactions/instruments/enumerations.json --format=yaml --pretty')
    instrument:
      id: urn:test-instrument
      version: '1.1'
    defaultLocalization: en
    steps:
    - type: question
      options:
        fieldId: q_fake
        text:
          en: q_fake
    - type: question
      options:
        fieldId: q_enumerated
        text:
          en: q_enumerated
        enumerations:
        - id: foo
          text:
            en: foo
        - id: bar
          text:
            en: The Bar


mobile-form-convert
===================

The ``mobile-form-convert`` command will generate a basic Web Form
Configuration from an SMS Interaction Configuration::

    >>> ctl('help mobile-form-convert')
    MOBILE-FORM-CONVERT - convert an SMS Interaction Configuration to a Web Form Configuration
    Usage: rex mobile-form-convert <configuration>
    <BLANKLINE>
    The mobile-form-convert task will take an input SMS Interaction
    Configuration file and convert it to an equivalent Web Form
    Configuration.
    <BLANKLINE>
    The configuration is the path to the file containing the SMS
    Interaction Configuration to format.
    <BLANKLINE>
    Options:
      --output=OUTPUT_FILE     : the file to write to; if not specified, stdout is used
      --format=FORMAT          : the format to output the configuration in; can be either JSON or YAML; if not specified, defaults to JSON
      --pretty                 : if specified, the outputted configuration will be formatted with newlines and indentation
    <BLANKLINE>


It requires one argument, path to the configuration file in JSON or YAML format::

    >>> ctl('mobile-form-convert', expect=1)
    FATAL ERROR: too few arguments for task mobile-form-convert: missing <configuration>
    <BLANKLINE>

    >>> ctl('mobile-form-convert ./test/interactions/simplest.json')
    {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "Fake question"}}}]}]}

    >>> ctl('mobile-form-convert ./test/interactions/simplest.yaml')
    {"instrument": {"id": "urn:test-instrument", "version": "1.1"}, "defaultLocalization": "en", "pages": [{"id": "page1", "elements": [{"type": "question", "options": {"fieldId": "q_fake", "text": {"en": "Fake question"}}}]}]}


It accepts options that dictate the various properties of the output format::

    >>> ctl('mobile-form-convert ./test/interactions/simplest.json --pretty')
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
                  "en": "Fake question"
                }
              }
            }
          ]
        }
      ]
    }

    >>> ctl('mobile-form-convert ./test/interactions/simplest.json --format=yaml')
    instrument: {id: 'urn:test-instrument', version: '1.1'}
    defaultLocalization: en
    pages:
    - id: page1
      elements:
      - type: question
        options:
          fieldId: q_fake
          text: {en: Fake question}

    >>> ctl('mobile-form-convert ./test/interactions/simplest.json --format=yaml --pretty')
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
            en: Fake question

