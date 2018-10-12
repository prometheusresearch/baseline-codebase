****************************
Definition Output Formatting
****************************

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.instrument.output import *


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

    >>> print(dump_instrument_yaml(INSTRUMENT))
    id: urn:test-instrument
    version: '1.1'
    title: The InstrumentVersion Title
    record:
    - {id: q_fake, type: text}

    >>> print(dump_instrument_yaml(INSTRUMENT, pretty=True))
    id: urn:test-instrument
    version: '1.1'
    title: The InstrumentVersion Title
    record:
    - id: q_fake
      type: text

    >>> print(dump_instrument_json(INSTRUMENT))
    {"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}

    >>> print(dump_instrument_json(INSTRUMENT, pretty=True))
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


