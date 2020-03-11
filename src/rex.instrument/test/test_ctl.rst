****************
REX.CTL Commands
****************

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.ctl import ctl

instrument-validate
===================

The ``instrument-validate`` command will validate the structure of a file
against the Common Instrument Definition::

    >>> ctl('help instrument-validate')
    INSTRUMENT-VALIDATE - validate a Common Instrument Definition
    Usage: rex instrument-validate <definition>
    <BLANKLINE>
    The instrument-validate task will validate the structure and content of the
    Common Instrument Definition in a file and report back if
    any errors are found.
    <BLANKLINE>
    The definition is the path to the file containing the Common Instrument
    Definition to validate.
    <BLANKLINE>


It requires a single argument which is the path to the file::

    >>> ctl('instrument-validate', expect=1)
    FATAL ERROR: too few arguments for task instrument-validate: missing <definition>
    <BLANKLINE>

    >>> ctl('instrument-validate ./test/instruments/simplest.json')
    "./test/instruments/simplest.json" contains a valid Common Instrument Definition.
    <BLANKLINE>

    >>> ctl('instrument-validate ./test/instruments/simplest.yaml')
    "./test/instruments/simplest.yaml" contains a valid Common Instrument Definition.
    <BLANKLINE>


It fails if the structure violates the specification in any way::

    >>> ctl('instrument-validate ./test/instruments/missing_title.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this Instrument:
    title: Required
    <BLANKLINE>


Or if the file doesn't actually exist::

    >>> ctl('instrument-validate /tmp/does/not/actually/exist.json', expect=1)
    FATAL ERROR: Could not open "/tmp/does/not/actually/exist.json": [Errno 2] No such file or directory: '/tmp/does/not/actually/exist.json'
    <BLANKLINE>


instrument-format
=================

The ``instrument-format`` command will format the specified definition in the
way specified::

    >>> ctl('help instrument-format')
    INSTRUMENT-FORMAT - render a Common Instrument Definition into various formats
    Usage: rex instrument-format <definition>
    <BLANKLINE>
    The instrument-format task will take an input Common Instrument Definition
    file and output it as either JSON or YAML.
    <BLANKLINE>
    The definition is the path to the file containing the Common Instrument
    Definition to format.
    <BLANKLINE>
    Options:
      --output=OUTPUT_FILE     : the file to write to; if not specified, stdout is used
      --format=FORMAT          : the format to output the definition in; can be either JSON or YAML; if not specified, defaults to JSON
      --pretty                 : if specified, the outputted definition will be formatted with newlines and indentation
    <BLANKLINE>


It requires a single argument which is the path to the file::

    >>> ctl('instrument-format', expect=1)
    FATAL ERROR: too few arguments for task instrument-format: missing <definition>
    <BLANKLINE>

    >>> ctl('instrument-format ./test/instruments/simplest.json')
    {"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}

    >>> ctl('instrument-format ./test/instruments/simplest.yaml')
    {"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}


It accepts options that dictate the various properties of the output format::

    >>> ctl('instrument-format ./test/instruments/simplest.json --format=YAML')
    id: urn:test-instrument
    version: '1.1'
    title: The InstrumentVersion Title
    record:
    - {id: q_fake, type: text}

    >>> ctl('instrument-format ./test/instruments/simplest.yaml --format=YAML')
    id: urn:test-instrument
    version: '1.1'
    title: The InstrumentVersion Title
    record:
    - {id: q_fake, type: text}

    >>> ctl('instrument-format ./test/instruments/simplest.json --format=JSON --pretty')
    {
      "id": "urn:test-instrument",
      "version": "1.1",
      "title": "The InstrumentVersion Title",
      "record": [
        {
          "id": "q_fake",
          "type": "text"
        }
      ]
    }

    >>> ctl('instrument-format ./test/instruments/simplest.json --format=YAML --pretty')
    id: urn:test-instrument
    version: '1.1'
    title: The InstrumentVersion Title
    record:
    - id: q_fake
      type: text


It fails if the input structure violates the specification in any way::

    >>> ctl('instrument-format ./test/instruments/missing_title.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this Instrument:
    title: Required
    <BLANKLINE>


Or if the file doesn't actually exist::

    >>> ctl('instrument-format /tmp/does/not/actually/exist.json', expect=1)
    FATAL ERROR: Could not open "/tmp/does/not/actually/exist.json": [Errno 2] No such file or directory: '/tmp/does/not/actually/exist.json'
    <BLANKLINE>


instrument-retrieve
===================

The ``instrument-retrieve`` command will retrieve the Common Instrument
Definition JSON from an InstrumentVersion in the project data store::

    >>> ctl('help instrument-retrieve')
    INSTRUMENT-RETRIEVE - retrieves an InstrumentVersion from the datastore
    Usage: rex instrument-retrieve <instrument-uid>
    <BLANKLINE>
    The instrument-retrieve task will retrieve an InstrumentVersion from a
    project's data store and return the Common Instrument Definition.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument in
    the data store.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional package
      --set=PARAM=VALUE        : set a configuration parameter
      --output=OUTPUT_FILE     : the file to write to; if not specified, stdout is used
      --format=FORMAT          : the format to output the definition in; can be either JSON or YAML; if not specified, defaults to JSON
      --pretty                 : if specified, the outputted definition will be formatted with newlines and indentation
      --version=VERSION        : the version of the Instrument to retrieve; if not specified, defaults to the latest version
    <BLANKLINE>


It requires a single argument which is the UID of the Instrument to retrieve::

    >>> ctl('instrument-retrieve', expect=1)
    FATAL ERROR: too few arguments for task instrument-retrieve: missing <instrument-uid>
    <BLANKLINE>

    >>> ctl('instrument-retrieve --project=rex.demo.instrument simple')
    {"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}


It takes a ``version`` option to specify which InstrumentVersion of the
Instrument to retrieve::

    >>> ctl('instrument-retrieve --project=rex.demo.instrument complex')
    {"id": "urn:another-test-instrument", "version": "1.2", "title": "The Other Instrument", "record": [{"id": "q_foo", "type": "text"}, {"id": "q_bar", "type": "integer"}, {"id": "q_baz", "type": "boolean"}]}

    >>> ctl('instrument-retrieve --project=rex.demo.instrument complex --version=1')
    {"id": "urn:another-test-instrument", "version": "1.1", "title": "The Other Instrument", "record": [{"id": "q_foo", "type": "text"}, {"id": "q_bar", "type": "integer"}]}


It can also print the JSON in a prettier way::

    >>> ctl('instrument-retrieve --project=rex.demo.instrument complex --pretty')
    {
      "id": "urn:another-test-instrument",
      "version": "1.2",
      "title": "The Other Instrument",
      "record": [
        {
          "id": "q_foo",
          "type": "text"
        },
        {
          "id": "q_bar",
          "type": "integer"
        },
        {
          "id": "q_baz",
          "type": "boolean"
        }
      ]
    }


It can also print the definition in YAML format::

    >>> ctl('instrument-retrieve --project=rex.demo.instrument complex --pretty --format=YAML')
    id: urn:another-test-instrument
    version: '1.2'
    title: The Other Instrument
    record:
    - id: q_foo
      type: text
    - id: q_bar
      type: integer
    - id: q_baz
      type: boolean


It fails if the instrument doesn't exist::

    >>> ctl('instrument-retrieve --project=rex.demo.instrument doesntexist', expect=1)
    FATAL ERROR: Instrument "doesntexist" does not exist.
    <BLANKLINE>


Or if the version doesn't exist::

    >>> ctl('instrument-retrieve --project=rex.demo.instrument simple --version=99', expect=1)
    FATAL ERROR: The desired version of "simple" does not exist.
    <BLANKLINE>


Or if you specify a bogus format::

    >>> ctl('instrument-retrieve --project=rex.demo.instrument complex --pretty --format=XML', expect=1)
    FATAL ERROR: invalid value for option --format: Invalid format type "XML" specified
    <BLANKLINE>


instrument-store
================

The ``instrument-store`` command will load a Common Instrument Definition JSON
to an InstrumentVersion in the project data store::

    >>> ctl('help instrument-store')
    INSTRUMENT-STORE - stores an InstrumentVersion in the data store
    Usage: rex instrument-store <instrument-uid> <definition>
    <BLANKLINE>
    The instrument-store task will write a Common Instrument Definition file to
    an InstrumentVersion in the project's data store.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument to use in
    the data store. If the UID does not already exist, a new Instrument will be
    created using that UID.
    <BLANKLINE>
    The definition is the path to the file containing the Common
    Instrument Definition to use.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional package
      --set=PARAM=VALUE        : set a configuration parameter
      --context=PARAM=VALUE    : the additional parameters to pass to the RexAcquire API implementations to create/save objects to the data store
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

    >>> ctl('instrument-store --project=rex.demo.instrument complex ./test/instruments/simplest.json')
    Using Instrument: Complex Instrument
    Created version: 3

    >>> ctl('instrument-store --project=rex.demo.instrument complex ./test/instruments/simplest.yaml')
    Using Instrument: Complex Instrument
    Created version: 3


It takes a ``version`` option to specify which InstrumentVersion of the
Instrument to store the JSON as::

    >>> ctl('instrument-store --project=rex.demo.instrument complex ./test/instruments/simplest.json --version=1')
    Using Instrument: Complex Instrument
    ### SAVED INSTRUMENTVERSION complex1
    Updated version: 1

    >>> ctl('instrument-store --project=rex.demo.instrument complex ./test/instruments/simplest.json --version=99')
    Using Instrument: Complex Instrument
    Created version: 99


It takes a series of ``context`` options to pass extra variables to the
underlying API implementation::

    >>> ctl('instrument-store --project=rex.demo.instrument complex ./test/instruments/simplest.json --context=extra_param=foo', expect=1)
    Using Instrument: Complex Instrument
    FATAL ERROR: Expected an integer
    Got:
        'foo'
    While checking:
        extra_param
    <BLANKLINE>

    >>> ctl('instrument-store --project=rex.demo.instrument complex ./test/instruments/simplest.json --context=extra_param=123')
    Using Instrument: Complex Instrument
    ### INSTRUMENTVERSION CREATE CONTEXT: {'extra_param': 123}
    Created version: 3


If you specify the UID of an Instrument that does not exist, it will be
created for you::

    >>> ctl('instrument-store --project=rex.demo.instrument doesntexist ./test/instruments/simplest.json')
    An Instrument by "doesntexist" does not exist; creating it.
    Using Instrument: doesntexist
    Created version: 1


calculationset-validate
=======================

The ``calculationset-validate`` command will validate the structure of a file
against the Common CalculationSet Definition::

    >>> ctl('help calculationset-validate')
    CALCULATIONSET-VALIDATE - validate a Common CalculationSet Definition
    Usage: rex calculationset-validate <definition>
    <BLANKLINE>
    The calculationset-validate task will validate the structure and content of
    the Common CalculationSet Definition in a file and report back if
    any errors are found.
    <BLANKLINE>
    The definition is the path to the file containing the Common CalculationSet
    Definition to validate.
    <BLANKLINE>
    Options:
      --instrument=FILE        : the file containing the associated Instrument Definition; if not specified, then the CalculationSet will only be checked for schema violations
    <BLANKLINE>

It requires a single argument which is the path to the file::

    >>> ctl('calculationset-validate', expect=1)
    FATAL ERROR: too few arguments for task calculationset-validate: missing <definition>
    <BLANKLINE>

    >>> ctl('calculationset-validate ./test/calculationsets/simplest.json')
    "./test/calculationsets/simplest.json" contains a valid Common CalculationSet Definition.
    <BLANKLINE>

    >>> ctl('calculationset-validate ./test/calculationsets/simplest.yaml')
    "./test/calculationsets/simplest.yaml" contains a valid Common CalculationSet Definition.
    <BLANKLINE>

It fails if the structure violates the specification in any way::

    >>> ctl('calculationset-validate ./test/calculationsets/missed-instrument.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this CalculationSet:
    instrument: Required
    <BLANKLINE>

    >>> ctl('calculationset-validate ./test/calculationsets/missed-calculations.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this CalculationSet:
    calculations: Required
    <BLANKLINE>

    >>> ctl('calculationset-validate ./test/calculationsets/no-calculation-id.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this CalculationSet:
    calculations.0.id: Required
    <BLANKLINE>

    >>> ctl('calculationset-validate ./test/calculationsets/bad-calculation-method.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this CalculationSet:
    calculations.0.method: "mymethod" is not one of python, htsql
    <BLANKLINE>

    >>> ctl('calculationset-validate ./test/calculationsets/bad-calculation-type.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this CalculationSet:
    calculations.0.type: "badtype" is not one of text, integer, float, boolean, date, time, dateTime
    <BLANKLINE>

    >>> ctl('calculationset-validate ./test/calculationsets/bad-options-given-expression-and-callable.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this CalculationSet:
    calculations.0: Exactly one option of "expression" or "callable" must be specified
    <BLANKLINE>

It can validate structure against given instrument::

    >>> ctl('calculationset-validate ./test/calculationsets/simplest.json --instrument ./test/instruments/calculation.json')
    "./test/calculationsets/simplest.json" contains a valid Common CalculationSet Definition.
    <BLANKLINE>

It fails if definition contains bad instrument version::

    >>> ctl('calculationset-validate ./test/calculationsets/bad-instrument-version.json --instrument ./test/instruments/calculation.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this CalculationSet:
    instrument: Incorrect Instrument version referenced
    <BLANKLINE>

Or if calculation or instrument file doesn't actually exist::

    >>> ctl('calculationset-validate /tmp/does/not/actually/exist.json', expect=1)
    FATAL ERROR: Could not open "/tmp/does/not/actually/exist.json": [Errno 2] No such file or directory: '/tmp/does/not/actually/exist.json'
    <BLANKLINE>

    >>> ctl('calculationset-validate ./test/calculationsets/simplest.json --instrument /tmp/does/not/actually/exist.json', expect=1)
    FATAL ERROR: Could not open "/tmp/does/not/actually/exist.json": [Errno 2] No such file or directory: '/tmp/does/not/actually/exist.json'
    <BLANKLINE>


calculationset-format
=====================

The ``calculationset-format`` command will format the specified definition in the
way specified::

    >>> ctl('help calculationset-format')
    CALCULATIONSET-FORMAT - render a Common CalculationSet Definition into various formats
    Usage: rex calculationset-format <definition>
    <BLANKLINE>
    The calculationset-format task will take an input Common CalculationSet
    Definition file and output it as either JSON or YAML.
    <BLANKLINE>
    The definition is the path to the file containing the Common CalculationSet
    Definition to format.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional package
      --set=PARAM=VALUE        : set a configuration parameter
      --output=OUTPUT_FILE     : the file to write to; if not specified, stdout is used
      --format=FORMAT          : the format to output the definition in; can be either JSON or YAML; if not specified, defaults to JSON
      --pretty                 : if specified, the outputted definition will be formatted with newlines and indentation
    <BLANKLINE>

It requires a single argument which is the path to the file::

    >>> ctl('calculationset-format', expect=1)
    FATAL ERROR: too few arguments for task calculationset-format: missing <definition>
    <BLANKLINE>

    >>> ctl('calculationset-format ./test/calculationsets/simplest.json')
    {"instrument": {"id": "urn:test-calculation", "version": "1.1"}, "calculations": [{"id": "calc1", "type": "integer", "method": "python", "options": {"callable": "mymodule.mycalc"}}, {"id": "calc2", "type": "integer", "method": "htsql", "options": {"expression": "/{if($offset_20150601<2, -100, 100) + switch($age, 'age18-29', 29, 'age30-49', 49, 'age50-64', 64, 'age65-and-over', 120, 0)}"}}, {"id": "calc3", "type": "boolean", "method": "python", "options": {"expression": "((-100 if offset_20150601<2 else 100) + (calc1+calc2))>=0"}}]}

    >>> ctl('calculationset-format ./test/calculationsets/simplest.yaml')
    {"instrument": {"id": "urn:test-calculation", "version": "1.1"}, "calculations": [{"id": "calc1", "type": "integer", "method": "python", "options": {"callable": "mymodule.mycalc"}}, {"id": "calc2", "type": "integer", "method": "htsql", "options": {"expression": "/{switch($age, 'age18-29', 29, 'age30-49', 49, 'age50-64', 64, 'age65-and-over', 120, 0)}"}}, {"id": "calc3", "type": "boolean", "method": "python", "options": {"expression": "(calc1+calc2)>=0"}}]}


It accepts options that dictate the various properties of the output format::

    >>> ctl('calculationset-format ./test/calculationsets/simplest.json --format=YAML')
    instrument: {id: 'urn:test-calculation', version: '1.1'}
    calculations:
    - id: calc1
      type: integer
      method: python
      options: {callable: mymodule.mycalc}
    - id: calc2
      type: integer
      method: htsql
      options: {expression: '/{if($offset_20150601<2, -100, 100) + switch($age, ''age18-29'',
          29, ''age30-49'', 49, ''age50-64'', 64, ''age65-and-over'', 120, 0)}'}
    - id: calc3
      type: boolean
      method: python
      options: {expression: ((-100 if offset_20150601<2 else 100) + (calc1+calc2))>=0}

    >>> ctl('calculationset-format ./test/calculationsets/simplest.yaml --format=JSON')
    {"instrument": {"id": "urn:test-calculation", "version": "1.1"}, "calculations": [{"id": "calc1", "type": "integer", "method": "python", "options": {"callable": "mymodule.mycalc"}}, {"id": "calc2", "type": "integer", "method": "htsql", "options": {"expression": "/{switch($age, 'age18-29', 29, 'age30-49', 49, 'age50-64', 64, 'age65-and-over', 120, 0)}"}}, {"id": "calc3", "type": "boolean", "method": "python", "options": {"expression": "(calc1+calc2)>=0"}}]}

    >>> ctl('calculationset-format ./test/calculationsets/simplest.json --format=JSON --pretty')
    {
      "instrument": {
        "id": "urn:test-calculation",
        "version": "1.1"
      },
      "calculations": [
        {
          "id": "calc1",
          "type": "integer",
          "method": "python",
          "options": {
            "callable": "mymodule.mycalc"
          }
        },
        {
          "id": "calc2",
          "type": "integer",
          "method": "htsql",
          "options": {
            "expression": "/{if($offset_20150601<2, -100, 100) + switch($age, 'age18-29', 29, 'age30-49', 49, 'age50-64', 64, 'age65-and-over', 120, 0)}"
          }
        },
        {
          "id": "calc3",
          "type": "boolean",
          "method": "python",
          "options": {
            "expression": "((-100 if offset_20150601<2 else 100) + (calc1+calc2))>=0"
          }
        }
      ]
    }

    >>> ctl('calculationset-format ./test/calculationsets/simplest.json --format=YAML --pretty')
    instrument:
      id: urn:test-calculation
      version: '1.1'
    calculations:
    - id: calc1
      type: integer
      method: python
      options:
        callable: mymodule.mycalc
    - id: calc2
      type: integer
      method: htsql
      options:
        expression: /{if($offset_20150601<2, -100, 100) + switch($age, 'age18-29', 29,
          'age30-49', 49, 'age50-64', 64, 'age65-and-over', 120, 0)}
    - id: calc3
      type: boolean
      method: python
      options:
        expression: ((-100 if offset_20150601<2 else 100) + (calc1+calc2))>=0

It fails if the input structure violates the specification in any way::

    >>> ctl('calculationset-format ./test/calculationsets/bad-calculation-method.json', expect=1)
    FATAL ERROR: The following problems were encountered when validating this CalculationSet:
    calculations.0.method: "mymethod" is not one of python, htsql
    <BLANKLINE>

Or if the file doesn't actually exist::

    >>> ctl('calculationset-format /tmp/does/not/actually/exist.json', expect=1)
    FATAL ERROR: Could not open "/tmp/does/not/actually/exist.json": [Errno 2] No such file or directory: '/tmp/does/not/actually/exist.json'
    <BLANKLINE>


calculationset-retrieve
=======================

The ``calculationset-retrieve`` command will retrieve the Common Instrument
Definition JSON from an InstrumentVersion in the project data store::

    >>> ctl('help calculationset-retrieve')
    CALCULATIONSET-RETRIEVE - retrieves an CalculationSet from the datastore
    Usage: rex calculationset-retrieve <instrument-uid>
    <BLANKLINE>
    The calculation-retrieve task will retrieve an CalculationSet from a
    project's data store and return the Common CalculationSet Definition.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument in
    the data store.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional package
      --set=PARAM=VALUE        : set a configuration parameter
      --output=OUTPUT_FILE     : the file to write to; if not specified, stdout is used
      --format=FORMAT          : the format to output the definition in; can be either JSON or YAML; if not specified, defaults to JSON
      --pretty                 : if specified, the outputted definition will be formatted with newlines and indentation
      --version=VERSION        : the version of the Instrument to retrieve; if not specified, defaults to the latest version
    <BLANKLINE>

It requires a single argument which is the UID of the Instrument to retrieve::

    >>> ctl('calculationset-retrieve', expect=1)
    FATAL ERROR: too few arguments for task calculationset-retrieve: missing <instrument-uid>
    <BLANKLINE>

    >>> ctl('calculationset-retrieve --project=rex.demo.instrument calculation')
    {"instrument": {"id": "urn:test-calculation", "version": "1.1"}, "calculations": [{"id": "calc1", "type": "integer", "method": "python", "options": {"callable": "rex.demo.instrument.my_calculation1"}}, {"id": "calc2", "type": "integer", "method": "htsql", "options": {"expression": "if($subject_status='completed', -100, 100) + switch($age, 'age18-29', 29, 'age30-49', 49, 'age50-64', 64, 'age65-and-over', 120, 0)"}}, {"id": "calc3", "type": "boolean", "method": "python", "options": {"expression": "((-100 if subject_status=='completed' else 100) + (calculations['calc1']+calculations['calc2']))>=0"}}]}

    >>> ctl('calculationset-retrieve --project=rex.demo.instrument simple', expect=1)
    FATAL ERROR: No CalculationSet exists for Instrument "simple", Version 1
    <BLANKLINE>

It takes a ``version`` option to specify which InstrumentVersion of the
Instrument to retrieve::

    >>> ctl('calculationset-retrieve --project=rex.demo.instrument calculation --version=1')
    {"instrument": {"id": "urn:test-calculation", "version": "1.1"}, "calculations": [{"id": "calc1", "type": "integer", "method": "python", "options": {"callable": "rex.demo.instrument.my_calculation1"}}, {"id": "calc2", "type": "integer", "method": "htsql", "options": {"expression": "if($subject_status='completed', -100, 100) + switch($age, 'age18-29', 29, 'age30-49', 49, 'age50-64', 64, 'age65-and-over', 120, 0)"}}, {"id": "calc3", "type": "boolean", "method": "python", "options": {"expression": "((-100 if subject_status=='completed' else 100) + (calculations['calc1']+calculations['calc2']))>=0"}}]}

It can also print the JSON in a prettier way::

    >>> ctl('calculationset-retrieve --project=rex.demo.instrument calculation --pretty')
    {
      "instrument": {
        "id": "urn:test-calculation",
        "version": "1.1"
      },
      "calculations": [
        {
          "id": "calc1",
          "type": "integer",
          "method": "python",
          "options": {
            "callable": "rex.demo.instrument.my_calculation1"
          }
        },
        {
          "id": "calc2",
          "type": "integer",
          "method": "htsql",
          "options": {
            "expression": "if($subject_status='completed', -100, 100) + switch($age, 'age18-29', 29, 'age30-49', 49, 'age50-64', 64, 'age65-and-over', 120, 0)"
          }
        },
        {
          "id": "calc3",
          "type": "boolean",
          "method": "python",
          "options": {
            "expression": "((-100 if subject_status=='completed' else 100) + (calculations['calc1']+calculations['calc2']))>=0"
          }
        }
      ]
    }

It can also print the definition in YAML format::

    >>> ctl('calculationset-retrieve --project=rex.demo.instrument calculation --pretty --format=YAML')
    instrument:
      id: urn:test-calculation
      version: '1.1'
    calculations:
    - id: calc1
      type: integer
      method: python
      options:
        callable: rex.demo.instrument.my_calculation1
    - id: calc2
      type: integer
      method: htsql
      options:
        expression: if($subject_status='completed', -100, 100) + switch($age, 'age18-29',
          29, 'age30-49', 49, 'age50-64', 64, 'age65-and-over', 120, 0)
    - id: calc3
      type: boolean
      method: python
      options:
        expression: ((-100 if subject_status=='completed' else 100) + (calculations['calc1']+calculations['calc2']))>=0

It fails if the instrument doesn't exist::

    >>> ctl('calculationset-retrieve --project=rex.demo.instrument doesntexist', expect=1)
    FATAL ERROR: Instrument "doesntexist" does not exist.
    <BLANKLINE>

Or if the version doesn't exist::

    >>> ctl('calculationset-retrieve --project=rex.demo.instrument calculation --version=2', expect=1)
    FATAL ERROR: The desired version of "calculation" does not exist.
    <BLANKLINE>

Or if you specify a bogus format::

    >>> ctl('calculationset-retrieve --project=rex.demo.instrument calculation --pretty --format=XML', expect=1)
    FATAL ERROR: invalid value for option --format: Invalid format type "XML" specified
    <BLANKLINE>


calculationset-store
====================

The ``calculationset-store`` command will load a Common Instrument Definition JSON
to an InstrumentVersion in the project data store::

    >>> ctl('help calculationset-store')
    CALCULATIONSET-STORE - stores an CalculationSet in the data store
    Usage: rex calculationset-store <instrument-uid> <definition>
    <BLANKLINE>
    The calculationset-store task will write a Common CalculationSet Definition
    file to an CalculationSet in the project's data store.
    <BLANKLINE>
    The instrument-uid argument is the UID of the desired Instrument to use in
    the data store. If the UID does not already exist the task fails.
    <BLANKLINE>
    The definition is the path to the file containing the Common
    CalculationSet Definition to use.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional package
      --set=PARAM=VALUE        : set a configuration parameter
      --context=PARAM=VALUE    : the additional parameters to pass to the RexAcquire API implementations to create/save objects to the data store
      --version=VERSION        : the version of Instrument to store the CalculationSet in; if not specified, one will be calculated
    <BLANKLINE>

It requires two arguments which are the UID of the Instrument and the path to
the file containing the CalculationSet JSON or YAML::

    >>> ctl('calculationset-store', expect=1)
    FATAL ERROR: too few arguments for task calculationset-store: missing <instrument-uid> <definition>
    <BLANKLINE>

    >>> ctl('calculationset-store simple', expect=1)
    FATAL ERROR: too few arguments for task calculationset-store: missing <definition>
    <BLANKLINE>

    >>> ctl('calculationset-store --project=rex.demo.instrument calculation ./test/calculationsets/simplest.json')
    Using Instrument: Calculation Instrument
    Instrument Version: 1
    ### SAVED CALCULATIONSET calculation1
    Updated existing CalculationSet

    >>> ctl('calculationset-store --project=rex.demo.instrument calculation ./test/calculationsets/simplest.yaml')
    Using Instrument: Calculation Instrument
    Instrument Version: 1
    ### SAVED CALCULATIONSET calculation1
    Updated existing CalculationSet

It takes a ``version`` option to specify which InstrumentVersion of the
Instrument to store the CalculationSet JSON as::

    >>> ctl('calculationset-store --project=rex.demo.instrument calculation ./test/calculationsets/simplest.json --version=1')
    Using Instrument: Calculation Instrument
    Instrument Version: 1
    ### SAVED CALCULATIONSET calculation1
    Updated existing CalculationSet

It fails if instrument doesnot exist::

    >>> ctl('calculationset-store --project=rex.demo.instrument doesntexist ./test/calculationsets/simplest.json', expect=1)
    FATAL ERROR: Instrument "doesntexist" does not exist.
    <BLANKLINE>

It fails if instrument version doesnot exist::

    >>> ctl('calculationset-store --project=rex.demo.instrument calculation ./test/calculationsets/simplest.json --version 2', expect=1)
    Using Instrument: Calculation Instrument
    FATAL ERROR: The desired version of "calculation" does not exist.
    <BLANKLINE>

