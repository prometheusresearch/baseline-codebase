**********************************
Use of REX.EXPRESSION in REX.FORMS
**********************************

.. contents:: Table of Contents
   :depth: 3


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

Absolute References
~~~~~~~~~~~~~~~~~~~

To reference a specific cell within a ``matrix``  Question, you use a
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


Local References
~~~~~~~~~~~~~~~~

When writing a trigger expression for an event associated specifically with a
column on a ``matrix`` (i.e., the ``event`` property is attached to the options
defined within the ``questions`` property of the top-level ``matrix`` Question
Element, rather than the options of the top-level ``matrix`` Question itself),
you can refer to fields **local to the row** by just specifying the column
name.

This variety of event is evaluated separately in the context of each row in the
matrix. In the event that a column of the current ``matrix`` has the same name
as a top-level Question, referring to that name in an expression will always
resolve to the value of the local field.

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

    q_text=='foo'

    q_int>50


RecordList Fields
-----------------

Absolute References
~~~~~~~~~~~~~~~~~~~

To reference the sub-fields within a ``recordList`` Question, you use a
combination of the field's unique ID joined with the ID of the sub-field you're
interested in. You must specify both parts joined with a period. If you only
refer to the ID of the recordList in your expression, it will always return
``null``. When addressed correctly, these references will return Lists that
contain elements of the appropriate type according to the behavior of the
`Simple Fields`_.

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


Local References
~~~~~~~~~~~~~~~~

Like ``matrix`` fields, you have the ability to reference, you can refere to
fields **local to the record** by just specifying the column name.

This variety of event is evaluated separately in the context of each row in the
matrix. In the event that a subfield of the current ``recordList`` has the same
name as a top-level Question, referring to that name in an expression will
always resolve to the value of the local field.

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

    q_text=='foo'

    q_int>50


Event Targets
=============

Top-Level Question Events
-------------------------

For events that are defined on top-level Questions (i.e., those that are
Elements on a Page), the targets for an event must either be page IDs, Element
tags, other top-level Question IDs, or the fully-qualified ID of subfields
within one of the complex Question types (``matrix``, ``recordList``).

You cannot target an entire column or entire row of a ``matrix`` by targetting
something like "matrix_field.row1" or "matrix_field.column1". You also cannot
target a specific record, or a subfield of a specific record in a
``recordList``.


Subfield Question Events
------------------------

For events that are defined on sub-questions (i.e., those that are defined in
the ``questions`` property of an Element's options), the targets for an event
must either be page IDs, Element tags, top-level Question IDs, the
fully-qualified ID of subfields within one of the complex Question types
(``matrix``, ``recordList``), or the non-fully-qualified ID of a subfield
within the current complex Question.

You cannot target an entire row of a ``matrix`` by targetting something like
"matrix_field.row1" or "row1". You also cannot target a specific record, or a
subfield of a specific record in a ``recordList``.

