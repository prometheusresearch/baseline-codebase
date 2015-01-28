****************************
Definition Output Formatting
****************************

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.instrument.output import *


OrderedDict
===========

The ``OrderedDict`` class functions identically to the one found in the
``collections`` module in Python::

    >>> test = OrderedDict()
    >>> test['one'] = 1
    >>> test['two'] = 2
    >>> test['three'] = 3

    >>> test.keys()
    ['one', 'two', 'three']

    >>> test.items()
    [('one', 1), ('two', 2), ('three', 3)]


SortedDict
==========

The ``SortedDict`` class operates similiarly to the ``OrderedDict``, but
instead of basing the key order on the order the keys were assigned, they are
sorted alphabetically::

    >>> test = SortedDict()
    >>> test['one'] = 1
    >>> test['two'] = 2
    >>> test['three'] = 3

    >>> test.keys()
    ['one', 'three', 'two']

    >>> test.items()
    [('one', 1), ('three', 3), ('two', 2)]


TypedSortedDict
===============

The ``TypedSortedDict`` class operates identically to the ``SortedDict``, but
will automatically cast all values to the specified type::

    >>> test = TypedSortedDict()
    >>> test.subtype = str
    >>> test['one'] = 1
    >>> test['two'] = 2
    >>> test['three'] = 3

    >>> test.keys()
    ['one', 'three', 'two']

    >>> test.items()
    [('one', '1'), ('three', '3'), ('two', '2')]

    >>> all([isinstance(val, str) for val in test.values()])
    True


DefinedOrderDict
================

The ``DefinedOrderDict`` class operates similarly to the ``SortedDict``, but
allows you to define which keys show up first and in which order. Any remaining
keys will then follow sorted alphabetically::

    >>> test = DefinedOrderDict()
    >>> test['one'] = 1
    >>> test['two'] = 2
    >>> test['three'] = 3

    >>> test.order = ['three', 'one']
    >>> test.keys()
    ['three', 'one', 'two']
    >>> test.items()
    [('three', 3), ('one', 1), ('two', 2)]

    >>> test.order = ['two']
    >>> test.keys()
    ['two', 'one', 'three']
    >>> test.items()
    [('two', 2), ('one', 1), ('three', 3)]


TypedDefinedOrderDict
=====================

The ``TypedDefinedOrderDict`` class operates identically to the
``DefinedOrderDict``, but will automatically cast select keys to specified
types::

    >>> test = TypedDefinedOrderDict()
    >>> test.key_types = {'one': str, 'three': float}
    >>> test['one'] = 1
    >>> test['two'] = 2
    >>> test['three'] = 3

    >>> test.order = ['three', 'one']
    >>> test.keys()
    ['three', 'one', 'two']
    >>> test.items()
    [('three', 3.0), ('one', '1'), ('two', 2)]

    >>> test.order = ['two']
    >>> test.keys()
    ['two', 'one', 'three']
    >>> test.items()
    [('two', 2), ('one', '1'), ('three', 3.0)]

    >>> isinstance(test['one'], str)
    True
    >>> isinstance(test['three'], float)
    True


dump_yaml, dump_json
====================

The dump functions are convenience wrappers around the ``yaml.dump`` and
``json.dumps`` functions that respect the ordering the dictionary objects in
this module produce, as well as expose a ``pretty`` argument that enable
formatting options in the encoders to output nicely indented text::

    >>> print dump_yaml(test)
    {two: 2, one: '1', three: 3.0}

    >>> print dump_yaml(test, pretty=True)
    two: 2
    one: '1'
    three: 3.0

    >>> print dump_json(test)
    {"two": 2, "one": "1", "three": 3.0}

    >>> print dump_json(test, pretty=True)
    {
      "two": 2,
      "one": "1",
      "three": 3.0
    }


dump_instrument_yaml, dump_instrument_json
==========================================

These functions are wrappers around the ``dump_yaml`` and ``dump_json``
functions that automatically encode Instrument definitions in a nice way
for output::

    >>> INSTRUMENT = {
    ...     "id": "urn:test-instrument",
    ...     "version": "1.1",
    ...     "title": "The InstrumentVersion Title",
    ...     "record": [
    ...         {
    ...             "id": "q_fake",
    ...             "type": "text"
    ...         }
    ...     ]
    ... }

    >>> print dump_instrument_yaml(INSTRUMENT)
    id: urn:test-instrument
    version: '1.1'
    title: The InstrumentVersion Title
    record:
    - {id: q_fake, type: text}

    >>> print dump_instrument_yaml(INSTRUMENT, pretty=True)
    id: urn:test-instrument
    version: '1.1'
    title: The InstrumentVersion Title
    record:
    - id: q_fake
      type: text

    >>> print dump_instrument_json(INSTRUMENT)
    {"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}

    >>> print dump_instrument_json(INSTRUMENT, pretty=True)
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

