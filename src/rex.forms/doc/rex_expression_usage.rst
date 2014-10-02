**********************************
Use of REX.EXPRESSION in REX.FORMS
**********************************

.. contents:: Table of Contents


This document will attempt to cover the usage of the ``rex.expression``
language (a.k.a., REXL) in the context of ``rex.forms`` Events and
Calculations. For specifics on the syntax and available operators/functions
that REXL supports, you should review its documentation.


Trigger Expressions
===================

Trigger expressions are the gatekeepers to the Event Objects in a Web Form
Configuration. The ``action`` defined within the Event will only take place if
the expression specified in the ``trigger`` property evaluates to a ``True``
value. If the expression evaluates to any other value, then the ``action`` will
be ignored.


Calculation Expressions
=======================

You can use REXL to define a formula to use to calculate the value of a field
in a Form. When a field's value is being driven by such a calculation, the
user will not be able to manually manipulate the value.

Currently, only `Simple Fields`_ can be the targets of calculations.

When writing calculation expressions, make sure that the value that they
produce is of the same data type as the field the value is being placed in,
otherwise you will cause Form validation errors that the user will not be able
to address.


Field Identifiers
=================

Within the REXL expressions that you write, you can refer to fields within a
Form and use their values as if they were literals. The following sections
describe how to do this for the various types of fields that may exist in a
Form.


Simple Fields
-------------

To reference ``text``, ``float``, ``integer``, ``enumeration``, ``boolean``,
``date``, ``time``, and ``dateTime`` fields, simply use the field's unique ID.
This is the ``id`` of the field from the Common Instrument Definition, which is
the same as the ``fieldId`` of the Question in the Web Form Configuration.
These references will return ``null`` if no value has been captured for them.
Otherwise, ``text`` and ``enumeration`` will return Strings, ``float`` and
``integer`` will return Numbers, ``boolean`` will return Booleans, ``date``
will return Dates, ``time`` will return Times, and ``dateTime`` will return
DateTimes.

Given an Instrument like the following::

    {
        "id": "urn:rexl-example",
        "version": "1.0",
        "title": "An Example",
        "record": [
            {
                "id": "q_text",
                "type": "text"
            },
            {
                "id": "q_float",
                "type": "float"
            },
            {
                "id": "q_int",
                "type": "integer"
            },
            {
                "id": "q_bool",
                "type": "boolean"
            },
            {
                "id": "q_enum",
                "type": {
                    "base": "enumeration",
                    "enumerations": {
                        "red": {},
                        "blue": {},
                        "green": {}
                    }
                }
            },
            {
                "id": "q_date",
                "type": "date"
            },
            {
                "id": "q_time",
                "type": "time"
            },
            {
                "id": "q_datetime",
                "type": "dateTime"
            }
        ]
    }


You could write expressions like these::

    q_text=='foo'

    q_float>43

    q_int+12

    if(q_bool, 'It is True', 'It is False')

    q_enumeration==null()|q_enumeration=='red'

    date_diff(q_date, today())>100

    q_time=='12:34:56'


EnumerationSet Fields
---------------------

There are two ways to reference the value of ``enumerationSet`` fields:

1. Much like the `Simple Fields`_, you can reference the field's unique ID. The
   reference will return a List containing all the selected enumerations in the
   set. If none are selected, this will return ``null``.

2. You use a combination of the field's unique ID joined with the ID of the
   enumeration you're interested in. You must specify both parts joined with a
   period. The reference will return a Boolean indicating whether or not the
   enumeration has been selected.

Given an Instrument like the following::

    {
        "id": "urn:rexl-example",
        "version": "1.0",
        "title": "An Example",
        "record": [
            {
                "id": "q_enumset",
                "type": {
                    "base": "enumerationSet",
                    "enumerations": {
                        "red": {},
                        "blue": {},
                        "green": {}
                    }
                }
            }
        ]
    }


You could write expressions like these::

    q_enumset.red==true()

    if(q_enumset.green, 'They chose GREEN!', 'Not green')

    q_enumset.blue|q_enumset.red

    length(q_enumset)>1


Matrix Fields
-------------

To reference the individual sub-fields within a ``matrix`` Question, you use a
combination of the field's unique ID joined with the ID of the Row and the ID
of the Column you're interested in. You must specify all three parts joined
with a period. If you only refer to one or two of the IDs in your expression,
it will always return ``null``. When addressed correctly, these references will
behave in the same way that `Simple Fields`_ do.

Given an Instrument like the following::

    {
        "id": "urn:rexl-example",
        "version": "1.0",
        "title": "An Example",
        "record": [
            {
                "id": "q_matrix",
                "type": {
                    "base": "matrix",
                    "rows": [
                        {
                            "id": "foo"
                        },
                        {
                            "id": "bar"
                        }
                    ],
                    "columns": [
                        {
                            "id": "q_text",
                            "type": "text",
                        },
                        {
                            "id": "q_int",
                            "type": "integer"
                        }
                    ]
                }
            }
        ]
    }


You could write expressions like these::

    q_matrix.foo.q_text=='foo'

    q_matrix.bar.q_int>50

    q_matrix.foo.q_int==q_matrix.bar.q_int


RecordList Fields
-----------------

To reference the individual sub-fields within a ``recordList`` Question, you
use a combination of the field's unique ID joined with the ID of the sub-field
you're interested in. You must specify both parts joined with a period. If you
only refer to the ID of the recordList in your expression, it will always
return ``null``. When addressed correctly, these references will return Lists
that contain elements of the appropriate type according to the behavior of the
`Simple Fields`_

Given an Instrument like the following::

    {
        "id": "urn:rexl-example",
        "version": "1.0",
        "title": "An Example",
        "record": [
            {
                "id": "q_recordlist",
                "type": {
                    "base": "recordList",
                    "record": [
                        {
                            "id": "q_text",
                            "type": "text",
                        },
                        {
                            "id": "q_int",
                            "type": "integer"
                        }
                    ]
                }
            }
        ]
    }


You could write expressions like these::

    length(q_recordlist.q_text)>1

    exists(q_recordlist.q_int<10)

    count(q_recordlist.q_text=='foo'&q_recordlist.q_int>25)

