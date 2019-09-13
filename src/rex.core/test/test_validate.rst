************************
  Validating utilities
************************

.. contents:: Table of Contents


Overview
========

``rex.core`` provides a number of utilities for validating and convering input
parameters.  These utilities could be used for validating configuration
settings, parsing HTTP form parameters and so on.

Here is how you could use it::

    >>> from rex.core import IntVal
    >>> int_val = IntVal()
    >>> int_val(3)
    3
    >>> int_val('10')
    10

Note that the integer validator accepts both an integer object and a numeric
string converting the latter to an integer.

When the validator rejects the input value, ``rex.core.Error`` exception is
raised::

    >>> int_val('NaN')
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected an integer
    Got:
        'NaN'

A validator can also be used to parse YAML documents::

    >>> int_val.parse("""
    ... ---
    ... -8
    ... """)
    -8

Use method ``parse_all()`` to parse a YAML stream containing several YAML
documents::

    >>> values = int_val.parse_all("""
    ... --- 2
    ... --- 3
    ... --- 5
    ... --- 7
    ... --- 11
    ... """)
    >>> list(values)
    [2, 3, 5, 7, 11]

Ill-formed YAML documents also raise ``rex.core.Error`` exception::

    >>> int_val.parse(""" : """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        while parsing a block mapping
        did not find expected key
          in "<unicode string>", line 1, column 2

    >>> list(int_val.parse_all(""" : """))
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        while parsing a block mapping
        did not find expected key
          in "<unicode string>", line 1, column 2


``AnyVal``
==========

``AnyVal`` accepts any input value and returns it unchanged::

    >>> from rex.core import AnyVal
    >>> any_val = AnyVal()
    >>> any_val
    AnyVal()
    >>> X = object()
    >>> any_val(X) == X
    True

``AnyVal`` parses any well-formed YAML document::

    >>> any_val.parse(""" X """)
    'X'


``ProxyVal``
============

``ProxyVal`` allows you to wrap another validator.  Since you don't need
to provide the wrapped validator during the construction time, it allows
you to validate recursive structures.  For example, here's how you could
express a structure that consists of nested lists::

    >>> from rex.core import ProxyVal, SeqVal
    >>> proxy_val = ProxyVal()
    >>> proxy_val
    ProxyVal()
    >>> bool(proxy_val)
    False
    >>> wrapped_val = SeqVal(proxy_val)
    >>> proxy_val.set(wrapped_val)
    >>> proxy_val
    ProxyVal(SeqVal(...))
    >>> bool(proxy_val)
    True

    >>> proxy_val([])
    []
    >>> proxy_val([[], [[]], []])
    [[], [[]], []]

    >>> proxy_val(None)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a sequence
    Got:
        None

``ProxyVal`` also works with YAML documents::

    >>> proxy_val.parse(""" [[], [[]], []] """)
    [[], [[]], []]


``MaybeVal``
============

``MaybeVal`` works as a wrapper around another validator.  It accepts all
values accepted by the wrapped validator *and* ``None``::

    >>> from rex.core import MaybeVal, IntVal
    >>> maybe_val = MaybeVal(IntVal)
    >>> maybe_val
    MaybeVal(IntVal())
    >>> maybe_val(10)
    10
    >>> maybe_val(None) is None
    True
    >>> maybe_val('NaN')
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        'NaN'

``MaybeVal`` works the same way with YAML documents::

    >>> maybe_val.parse(""" 10 """)
    10
    >>> maybe_val.parse(""" null """) is None
    True
    >>> maybe_val.parse(""" NaN """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        NaN
    While parsing:
        "<unicode string>", line 1

An empty YAML stream is interpreted as a ``null`` value::

    >>> maybe_val.parse(""" """) is None
    True


``OneOfVal``
============

``OneOfVal`` wraps a set of validators.  Given an input, it tries each wrapped
validator one by one and returns the value produced by the first succeeding
validator.  ``OneOfVal`` validator fails if all the wrapped validators reject
the input::

    >>> from rex.core import OneOfVal, BoolVal, IntVal
    >>> oneof_val = OneOfVal(BoolVal(), IntVal())
    >>> oneof_val
    OneOfVal(BoolVal(), IntVal())
    >>> oneof_val('1')
    True
    >>> oneof_val('10')
    10
    >>> oneof_val('NaN')
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to match the value against any of the following:
        Expected a Boolean value
        Got:
            'NaN'
    <BLANKLINE>
        Expected an integer
        Got:
            'NaN'

Note how ``'1'`` is converted to a Boolean value while ``'10'`` becomes an
integer.  That's because ``BoolVal`` is tried first and ``'1'`` is recognized
by ``BoolVal`` as a ``True`` value while ``'10'`` doesn't.


``StrVal``
==========

``StrVal`` accepts 8-bit and Unicode strings.  8-bit strings are expected to be
in UTF-8 encoding.  The output is always a Unicode string::

    >>> from rex.core import StrVal
    >>> str_val = StrVal()
    >>> str_val
    StrVal()
    >>> str_val('Hello')
    'Hello'
    >>> str_val(b'Hello')
    'Hello'
    >>> str_val(None)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a string
    Got:
        None
    >>> str_val('\N{CYRILLIC CAPITAL LETTER YA}')
    'Я'
    >>> str_val('\N{CYRILLIC CAPITAL LETTER YA}'.encode('utf-8'))
    'Я'
    >>> str_val('\N{CYRILLIC CAPITAL LETTER YA}'.encode('cp1251'))
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a valid UTF-8 string
    Got:
        b'\xdf'

``StrVal`` can also parse YAML documents::

    >>> str_val.parse(""" Hello """)
    'Hello'
    >>> str_val.parse(""" null """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a string
    Got:
        null
    While parsing:
        "<unicode string>", line 1
    >>> str_val.parse(""" [] """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a string
    Got:
        a sequence
    While parsing:
        "<unicode string>", line 1

``StrVal`` constructor takes an optional argument: a regular expression
pattern.  When the pattern is provided, only input strings that match this
pattern are accepted::

    >>> ssn_val = StrVal(r'\d\d\d-\d\d-\d\d\d\d')
    >>> ssn_val
    StrVal('\\d\\d\\d-\\d\\d-\\d\\d\\d\\d')
    >>> ssn_val('123-12-1234')
    '123-12-1234'
    >>> ssn_val('John Doe')
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a string matching:
        /\d\d\d-\d\d-\d\d\d\d/
    Got:
        'John Doe'

The whole input must match the pattern::

    >>> ssn_val('123-12-1234 John Doe')
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a string matching:
        /\d\d\d-\d\d-\d\d\d\d/
    Got:
        '123-12-1234 John Doe'

``StrFormatVal``
================

``StrFormatVal`` can format strings using a predefined set of values::

    >>> from rex.core import StrFormatVal
    >>> str_format_val = StrFormatVal({'name': 'World'})

    >>> str_format_val('Hello, {name}!')
    'Hello, World!'

    >>> str_format_val('Hello, {unknown}!') # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    rex.core.Error: Found unknown key "unknown" while formatting string:
        Hello, {unknown}!

Otherwise it behaves similar to ``StrVal``::

    >>> str_format_val('string')
    'string'
    >>> str_format_val(42) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    rex.core.Error: Expected a string
    Got:
        42

``PathVal``
===========

``PathVal`` accepts paths and validate (syntactically) that they are absolute
paths::

    >>> from rex.core import PathVal
    >>> path_val = PathVal()

    >>> path_val('/abs/path')
    '/abs/path'

It fails on relative paths::

    >>> path_val('./rel/path') # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    rex.core.Error: Expected an absolute path but found:
        ./rel/path
    <BLANKLINE>
        (Hint: make it "{cwd}/rel/path" to be relative to the working dir)

Allows to use ``{sys_prefix}`` to refer to the Python environment prefix::

    >>> import sys, os.path

    >>> relpath = path_val('{sys_prefix}/rel/path')
    >>> relpath == sys.prefix + '/rel/path'
    True

Allows to use ``{sys_prefix}`` to refer to the current working dir::

    >>> import os

    >>> relpath = path_val('{cwd}/rel/path')
    >>> relpath == os.getcwd() + '/rel/path'
    True

``ChoiceVal``
=============

``ChoiceVal`` accepts strings from a predefined set of values::

    >>> from rex.core import ChoiceVal
    >>> choice_val = ChoiceVal('one', 'two', 'three')
    >>> choice_val
    ChoiceVal('one', 'two', 'three')
    >>> choice_val('two')
    'two'
    >>> choice_val('two')
    'two'
    >>> choice_val(2)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a string
    Got:
        2
    >>> choice_val('five')
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected one of:
        one, two, three
    Got:
        'five'

``ChoiceVal`` also accepts a list of values::

    >>> ChoiceVal(['one', 'two', 'three'])
    ChoiceVal('one', 'two', 'three')

``ChoiceVal`` can parse YAML documents::

    >>> choice_val.parse(""" two """)
    'two'
    >>> choice_val.parse(""" 2 """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a string
    Got:
        2
    While parsing:
        "<unicode string>", line 1


``BoolVal``
===========

``BoolVal`` accepts Boolean values.  ``0``, ``''``, ``'0'``, and ``'false'``
are recognized as ``False`` values while ``1``, ``'1'`` and ``'true'`` are
recognized as ``True`` values::

    >>> from rex.core import BoolVal
    >>> bool_val = BoolVal()
    >>> bool_val
    BoolVal()
    >>> bool_val(False)
    False
    >>> bool_val(0)
    False
    >>> bool_val('0')
    False
    >>> bool_val('false')
    False
    >>> bool_val(True)
    True
    >>> bool_val(1)
    True
    >>> bool_val('1')
    True
    >>> bool_val('true')
    True
    >>> bool_val(None)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a Boolean value
    Got:
        None

``BoolVal`` can parse YAML documents::

    >>> bool_val.parse(""" false """)
    False
    >>> bool_val.parse(""" null """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a Boolean value
    Got:
        null
    While parsing:
        "<unicode string>", line 1


``IntVal``, ``PIntVal``, ``UIntVal``
====================================

``IntVal`` accepts integer values.  Numeric strings are also accepted and converted
to integer::

    >>> from rex.core import IntVal
    >>> int_val = IntVal()
    >>> int_val
    IntVal()
    >>> int_val(10)
    10
    >>> int_val('10')
    10
    >>> int_val('NaN')
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        'NaN'
    >>> int_val(None)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        None

``IntVal`` can parse YAML documents::

    >>> int_val.parse(""" 10 """)
    10
    >>> int_val.parse(""" NaN """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        NaN
    While parsing:
        "<unicode string>", line 1

``IntVal`` takes two optional parameters: lower and upper bounds.  Values
outside of these bounds are rejected::

    >>> int_1to10_val = IntVal(1, 10)
    >>> int_1to10_val
    IntVal(min_bound=1, max_bound=10)
    >>> int_1to10_val(1)
    1
    >>> int_1to10_val(5)
    5
    >>> int_1to10_val(10)
    10
    >>> int_1to10_val(0)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer in range:
        [1..10]
    Got:
        0
    >>> int_1to10_val(11)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer in range:
        [1..10]
    Got:
        11
    >>> int_1to_val = IntVal(min_bound=1)
    >>> int_1to_val
    IntVal(min_bound=1)
    >>> int_1to_val(1)
    1
    >>> int_1to_val(0)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer in range:
        [1..]
    Got:
        0
    >>> int_to10_val = IntVal(max_bound=10)
    >>> int_to10_val
    IntVal(max_bound=10)
    >>> int_to10_val(10)
    10
    >>> int_to10_val(11)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer in range:
        [..10]
    Got:
        11

``PIntVal`` and ``UIntVal`` are aliases for ``IntVal(1)`` and ``IntVal(0)``
respectively::

    >>> from rex.core import PIntVal, UIntVal
    >>> pint_val = PIntVal()
    >>> pint_val
    PIntVal()
    >>> pint_val(1)
    1
    >>> pint_val(0)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer in range:
        [1..]
    Got:
        0
    >>> uint_val = UIntVal()
    >>> uint_val
    UIntVal()
    >>> uint_val(0)
    0
    >>> uint_val(-1)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer in range:
        [0..]
    Got:
        -1


``FloatVal``
============

``FloatVal`` accepts float (or integer) values.  Numeric strings are also
accepted and converted to float::

    >>> from rex.core import FloatVal
    >>> float_val = FloatVal()
    >>> float_val
    FloatVal()
    >>> float_val(0.5)
    0.5
    >>> float_val(5)
    5.0
    >>> float_val(5)
    5.0
    >>> float_val('5e-1')
    0.5
    >>> float_val('5')
    5.0
    >>> float_val('NaN')
    nan
    >>> float_val('Inf')
    inf
    >>> float_val('-Inf')
    -inf
    >>> float_val('127.0.0.1')
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a float value
    Got:
        '127.0.0.1'

``IntVal`` can parse YAML documents::

    >>> float_val.parse(""" 0.5 """)
    0.5
    >>> float_val.parse(""" 5 """)
    5.0
    >>> float_val.parse(""" 127.0.0.1 """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a float value
    Got:
        127.0.0.1
    While parsing:
        "<unicode string>", line 1


``SeqVal``
==========

``SeqVal`` accepts list values::

    >>> from rex.core import SeqVal
    >>> seq_val = SeqVal()
    >>> seq_val
    SeqVal()
    >>> seq_val([0, False, None])
    [0, False, None]
    >>> seq_val(None)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a sequence
    Got:
        None

If you pass a string, it must be a valid JSON array::

    >>> seq_val('[-:]')
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a JSON array
    Got:
        '[-:]'
    >>> seq_val('[0, false, null]')
    [0, False, None]

``SeqVal`` has an optional parameter: a validator to apply to sequence items::

    >>> from rex.core import IntVal
    >>> int_seq_val = SeqVal(IntVal)
    >>> int_seq_val
    SeqVal(IntVal())
    >>> int_seq_val([])
    []
    >>> int_seq_val(['1', '2', '3'])
    [1, 2, 3]
    >>> int_seq_val([1, '2', 'three'])
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        'three'
    While validating sequence item
        #3

``SeqVal`` can also parse YAML documents::

    >>> seq_val.parse(""" [0, false, null] """)
    [0, False, None]
    >>> seq_val.parse(""" null """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a sequence
    Got:
        null
    While parsing:
        "<unicode string>", line 1

An empty YAML document is interpreted as an empty list::

    >>> seq_val.parse(""" """)
    []


``OneOrSeqVal``
===============

``OneOrSeqVal`` accepts an item or a list of items::

    >>> from rex.core import OneOrSeqVal
    >>> one_or_seq_val = OneOrSeqVal(IntVal)
    >>> one_or_seq_val
    OneOrSeqVal(IntVal())
    >>> one_or_seq_val([2, 3, 5, 7])
    [2, 3, 5, 7]
    >>> one_or_seq_val(11)
    11
    >>> one_or_seq_val([0, False, None])
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        False
    While validating sequence item
        #2
    >>> one_or_seq_val('NaN')
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        'NaN'

``OneOrSeqVal`` can also parse YAML documents::

    >>> one_or_seq_val.parse(""" [2, 3, 5, 7] """)
    [2, 3, 5, 7]
    >>> one_or_seq_val.parse(""" 11 """)
    11


``MapVal``
==========

``MapVal`` accepts dictionaries::

    >>> from rex.core import MapVal
    >>> map_val = MapVal()
    >>> map_val
    MapVal()
    >>> map_val({'0': 'false'})
    {'0': 'false'}
    >>> map_val(None)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a mapping
    Got:
        None

If you pass a string, it must be a valid JSON object::

    >>> map_val('{-:}')
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a JSON object
    Got:
        '{-:}'
    >>> map_val('{"0": false}')
    {'0': False}

``MapVal`` constructor takes two optional parameters: validators for mapping
keys and mapping values::

    >>> from rex.core import IntVal, PIntVal, BoolVal
    >>> i2b_map_val = MapVal(IntVal, BoolVal)
    >>> i2b_map_val
    MapVal(IntVal(), BoolVal())
    >>> i2b_map_val({})
    {}
    >>> i2b_map_val({'0': 'false'})
    {0: False}
    >>> pi2b_map_val = MapVal(PIntVal, BoolVal)
    >>> pi2b_map_val({'0': 'false'})
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer in range:
        [1..]
    Got:
        '0'
    While validating mapping key:
        '0'
    >>> i2i_map_val = MapVal(IntVal, IntVal)
    >>> i2i_map_val({'0': 'false'})
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        'false'
    While validating mapping value for key:
        0

``MapVal`` can also parse YAML documents::

    >>> map_val.parse(""" {'0': 'false'} """)
    {'0': 'false'}
    >>> map_val.parse(""" null """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a mapping
    Got:
        null
    While parsing:
        "<unicode string>", line 1

``MapVal`` can detect ill-formed YAML mappings::

    >>> map_val.parse(""" { {}: {} } """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        while constructing a mapping
          in "<unicode string>", line 1, column 2
        found an unacceptable key (unhashable type: 'dict')
          in "<unicode string>", line 1, column 4
    >>> map_val.parse(""" { key: value, key: value } """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        while constructing a mapping
          in "<unicode string>", line 1, column 2
        found a duplicate key
          in "<unicode string>", line 1, column 16

An empty YAML document is interpreted as an empty dictionary::

    >>> map_val.parse(""" """)
    {}


``OMapVal``
===========

``OMapVal`` accepts lists of pairs or one-element dictionaries::

    >>> from rex.core import OMapVal
    >>> omap_val = OMapVal()
    >>> omap_val
    OMapVal()
    >>> omap_val([('0', 'false'), ('1', 'true')])
    OrderedDict([('0', 'false'), ('1', 'true')])
    >>> omap_val([{'0': 'false'}, {'1': 'true'}])
    OrderedDict([('0', 'false'), ('1', 'true')])
    >>> omap_val(None)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an ordered mapping
    Got:
        None
    >>> omap_val([(1, 2, 3)])
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an ordered mapping
    Got:
        [(1, 2, 3)]
    >>> omap_val([{}])
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an ordered mapping
    Got:
        [{}]

``collections.OrderedDict`` objects are also accepted::

    >>> import collections
    >>> omap_val(collections.OrderedDict([(0, False), (1, True)]))
    OrderedDict([(0, False), (1, True)])

If you pass a string, it must be a valid JSON object::

    >>> omap_val('{-:}')
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a JSON object
    Got:
        '{-:}'
    >>> omap_val('{"0": false, "1": true}')
    OrderedDict([('0', False), ('1', True)])

``OMapVal`` constructor takes two optional parameters: validators for mapping
keys and mapping values::

    >>> from rex.core import IntVal, PIntVal, BoolVal
    >>> i2b_omap_val = OMapVal(IntVal, BoolVal)
    >>> i2b_omap_val
    OMapVal(IntVal(), BoolVal())
    >>> i2b_omap_val([])
    OrderedDict()
    >>> i2b_omap_val([{'0': 'false'}])
    OrderedDict([(0, False)])
    >>> pi2b_omap_val = OMapVal(PIntVal, BoolVal)
    >>> pi2b_omap_val([{'0': 'false'}])
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer in range:
        [1..]
    Got:
        '0'
    While validating mapping key:
        '0'
    >>> i2i_omap_val = OMapVal(IntVal, IntVal)
    >>> i2i_omap_val([{'0': 'false'}])
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        'false'
    While validating mapping value for key:
        0

``OMapVal`` can parse YAML documents::

    >>> omap_val.parse(""" [ '0': 'false', '1': 'true' ] """)
    OrderedDict([('0', 'false'), ('1', 'true')])
    >>> omap_val.parse(""" null """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an ordered mapping
    Got:
        null
    While parsing:
        "<unicode string>", line 1

``MapVal`` can detect ill-formed ordered mappings in a YAML document::

    >>> omap_val.parse(""" [ null ] """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an entry of an ordered mapping
    Got:
        null
    While parsing:
        "<unicode string>", line 1
    >>> omap_val.parse(""" [ {} ] """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an entry of an ordered mapping
    Got:
        a mapping
    While parsing:
        "<unicode string>", line 1
    >>> omap_val.parse(""" [ {}: {} ] """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        while constructing a mapping
          in "<unicode string>", line 1, column 2
        found an unacceptable key (unhashable type: 'dict')
          in "<unicode string>", line 1, column 4

An empty YAML document is interpreted as an empty mapping::

    >>> omap_val.parse(""" """)
    OrderedDict()


``RecordVal``
=============

``RecordVal`` expects a dictionary with a fixed set of keys and converts it
to a ``collections.namedtuple`` object.  It is parameterized with a list of
fields::

    >>> from rex.core import RecordVal
    >>> record_val = RecordVal(('name', StrVal),
    ...                        ('age', MaybeVal(UIntVal), None))
    >>> record_val
    RecordVal(('name', StrVal()), ('age', MaybeVal(UIntVal()), None))
    >>> record = record_val({'name': "Alice", 'age': '33'})
    >>> record
    Record(name='Alice', age=33)

The ``RecordVal`` constructor also accepts a list of fields::

    >>> RecordVal([('name', StrVal),
    ...            ('age', MaybeVal(UIntVal), None)])
    RecordVal(('name', StrVal()), ('age', MaybeVal(UIntVal()), None))

``RecordVal`` allows tuples and serialized JSON objects::

    >>> record_val(record)
    Record(name='Alice', age=33)
    >>> record_val(("Alice", 33))
    Record(name='Alice', age=33)
    >>> record_val('{"name": "Alice", "age": 33}')
    Record(name='Alice', age=33)

Ill-formed tuples or JSON objects are rejected::

    >>> record_val(("Bob", 'm', 12))
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a mapping
    Got:
        ('Bob', 'm', 12)
    >>> import collections
    >>> Person = collections.namedtuple("Person", "name sex")
    >>> record_val(Person("Clarence", 'm'))
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a record with fields:
        name, age
    Got:
        Person(name='Clarence', sex='m')
    >>> record_val("David")
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a JSON object
    Got:
        'David'

Optional fields can be omitted, but mandatory cannot be::

    >>> record_val({'name': "Bob"})
    Record(name='Bob', age=None)
    >>> record_val({'age': 81})
    Traceback (most recent call last):
      ...
    rex.core.Error: Missing mandatory field:
        name

Unexpected fields are rejected::

    >>> record_val({'name': "Eleonore", 'sex': 'f'})
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unexpected field:
        sex

Invalid field values are reported::

    >>> record_val({'name': "Fiona", 'age': False})
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        False
    While validating field:
        age

``RecordVal`` mangles field names that coincide with Python keywords::

    >>> kwd_record_val = RecordVal(('if', BoolVal),
    ...                            ('then', IntVal))
    >>> kwd_record_val
    RecordVal(('if', BoolVal()), ('then', IntVal()))
    >>> kwd_record_val({'if': True, 'then': 42})
    Record(if_=True, then=42)

``RecordVal`` can also parse YAML documents::

    >>> record_val.parse(""" { name: Alice, age: 33 } """)
    Record(name='Alice', age=33)
    >>> record_val.parse(""" null """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a mapping
    Got:
        null
    While parsing:
        "<unicode string>", line 1

``RecordVal`` accepts missing optional fields, but reports duplicate, unknown
or missing mandatory fields in a YAML document::

    >>> record_val.parse(""" { name: Bob } """)
    Record(name='Bob', age=None)
    >>> record_val.parse(""" { name: Alice, name: Bob } """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Got duplicate field:
        name
    While parsing:
        "<unicode string>", line 1
    >>> record_val.parse(""" { name: Eleonore, sex: f } """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unexpected field:
        sex
    While parsing:
        "<unicode string>", line 1
    >>> record_val.parse(""" { age: 81 } """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Missing mandatory field:
        name
    While parsing:
        "<unicode string>", line 1

If every field has a default value, ``RecordVal`` interprets an empty document
as a record with all default values::

    >>> default_record_val = RecordVal([('mother', StrVal, None),
    ...                                 ('father', StrVal, None)])
    >>> default_record_val.parse(""" """)
    Record(mother=None, father=None)

``RecordVal`` annotates nested validation errors::

    >>> record_val.parse(""" { name: Fiona, age: false } """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        false
    While parsing:
        "<unicode string>", line 1
    While validating field:
        age

If we want to ignore unexpected fields instead of rejecting them, we can use
`OpenRecordVal`::

    >>> from rex.core import OpenRecordVal

    >>> open_record_val = OpenRecordVal(('name', StrVal),
    ...                                 ('age', MaybeVal(UIntVal), None))
    >>> open_record_val({'name': "Eleonore", 'sex': 'f'})
    Record(name='Eleonore', age=None)
    >>> open_record_val.parse(""" { name: Eleonore, sex: f } """)
    Record(name='Eleonore', age=None)


``SwitchVal``
=============

``SwitchVal`` chooses which validator to apply based on the fields of the input
record::

    >>> from rex.core import SwitchVal
    >>> switch_val = SwitchVal({'name': record_val})
    >>> switch_val
    SwitchVal({'name': RecordVal(('name', StrVal()), ('age', MaybeVal(UIntVal()), None))})
    >>> switch_val({'name': "Alice", 'age': '33'})
    Record(name='Alice', age=33)
    >>> switch_val({'age': 81})
    Traceback (most recent call last):
      ...
    rex.core.Error: Cannot recognize a record
    Got:
        {'age': 81}

``SwitchVal`` also accepts serialized JSON objects and named tuples::

    >>> switch_val('{"name": "Alice", "age": 33}')
    Record(name='Alice', age=33)
    >>> switch_val(_)
    Record(name='Alice', age=33)

Without the default validator, unexpected values are rejected::

    >>> switch_val(None)
    Traceback (most recent call last):
      ...
    rex.core.Error: Cannot recognize a record
    Got:
        None

If the default validator is provided, it is used for values that ``SwitchVal``
cannot recognize::

    >>> default_switch_val = SwitchVal({'name': record_val}, IntVal())
    >>> default_switch_val
    SwitchVal({'name': RecordVal(('name', StrVal()), ('age', MaybeVal(UIntVal()), None))}, IntVal())
    >>> default_switch_val({'name': "Alice", 'age': '33'})
    Record(name='Alice', age=33)
    >>> default_switch_val("81")
    81
    >>> default_switch_val("Bob")
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        'Bob'

``SwitchVal`` can parse YAML documents::

    >>> switch_val.parse(""" { name: Alice, age: 33 } """)
    Record(name='Alice', age=33)
    >>> switch_val.parse(""" null """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a mapping
    Got:
        null
    While parsing:
        "<unicode string>", line 1

``SwitchVal`` rejects or uses the default validator to parse YAML nodes it
cannot recognize::

    >>> switch_val.parse(""" { age: 81 } """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Cannot recognize a record
    While parsing:
        "<unicode string>", line 1
    >>> default_switch_val.parse(""" { true: false } """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        a mapping
    While parsing:
        "<unicode string>", line 1
    >>> default_switch_val.parse(""" 81 """)
    81


``UnionVal``
============

``UnionVal`` is a union of several validators.  ``UnionVal`` selects
which validator to apply based on a set of conditions::

    >>> from rex.core import UnionVal, OnScalar, OnSeq, OnMap
    >>> union_val = UnionVal([(OnScalar, IntVal),
    ...                       (OnSeq, SeqVal(IntVal)),
    ...                       (OnMap, MapVal(IntVal, BoolVal))])
    >>> union_val
    UnionVal((OnScalar(), IntVal()), (OnSeq(), SeqVal(IntVal())), (OnMap(), MapVal(IntVal(), BoolVal())))
    >>> union_val('10')
    10
    >>> union_val(['10'])
    [10]
    >>> union_val({'10': 'true'})
    {10: True}
    >>> union_val(())
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected one of:
        scalar
        sequence
        mapping
    Got:
        ()

``UnionVal`` can also be used to discriminate between records of different
types::

    >>> from rex.core import OnField
    >>> record_union_val = UnionVal(('name', RecordVal(('name', StrVal),
    ...                                                ('age', MaybeVal(UIntVal), None))))
    >>> record_union_val
    UnionVal((OnField('name'), RecordVal(('name', StrVal()), ('age', MaybeVal(UIntVal()), None))))
    >>> record_union_val({'name': "Alice", 'age': '33'})
    Record(name='Alice', age=33)

The record type could be specified with a scalar field::

    >>> typed_record_val = UnionVal((OnField('type', 'Person'),
    ...                              OpenRecordVal(('name', StrVal), ('age', MaybeVal(UIntVal), None))),
    ...                             (OnField('type', 'Dog'),
    ...                              OpenRecordVal(('name', StrVal), ('breed', StrVal, None))))
    >>> typed_record_val({'name': 'Alice', 'type': 'Person'})
    Record(name='Alice', age=None)
    >>> typed_record_val({'name': 'Bob', 'type': 'Dog'})
    Record(name='Bob', breed=None)
    >>> typed_record_val({'name': 'Catherine'})
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected one of:
        Person record
        Dog record
    Got:
        {'name': 'Catherine'}

``UnionVal`` understands serialized JSON objects and named tuples::

    >>> record_union_val('{"name": "Alice", "age": 33}')
    Record(name='Alice', age=33)
    >>> record_union_val(_)
    Record(name='Alice', age=33)

Without the default validator, unexpected values are rejected::

    >>> record_union_val({'age': 81})
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected one of:
        name record
    Got:
        {'age': 81}
    >>> record_union_val('-')
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected one of:
        name record
    Got:
        '-'

If the default validator is provided, ``UnionVal`` never raises an error::

    >>> default_union_val = UnionVal((OnSeq, SeqVal(IntVal)), IntVal)
    >>> default_union_val(['10'])
    [10]
    >>> default_union_val('10')
    10
    >>> default_union_val(None)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected an integer
    Got:
        None

``UnionVal`` can parse YAML documents::

    >>> union_val.parse(""" 10 """)
    10
    >>> union_val.parse(""" [10] """)
    [10]
    >>> union_val.parse(""" { 10: true } """)
    {10: True}

    >>> record_union_val.parse(""" { name: Alice, age: 33 } """)
    Record(name='Alice', age=33)
    >>> record_union_val.parse(""" { age: 81 } """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected one of:
        name record
    Got:
        a mapping
    While parsing:
        "<unicode string>", line 1


``DateVal``
===========

``DateVal`` validates ISO8601-formatted dates and compatible objects and
returns them as ``datetime.date`` objects::

    >>> from datetime import datetime, date, time
    >>> from dateutil.tz import tzoffset
    >>> TEST_TZ = tzoffset('TestTZ', 60 * 60)
    >>> TEST_DATE = date(2017, 5, 22)
    >>> TEST_TIME = time(12, 34, 56, 789)
    >>> TEST_TIME_TZ = time(12, 34, 56, 789, TEST_TZ)
    >>> TEST_DATETIME = datetime(2017, 5, 22, 12, 34, 56, 789)
    >>> TEST_DATETIME_TZ = datetime(2017, 5, 22, 12, 34, 56, 789, TEST_TZ)

    >>> from rex.core import DateVal
    >>> date_val = DateVal()

    >>> date_val(TEST_DATE)
    datetime.date(2017, 5, 22)
    >>> date_val(TEST_DATETIME)
    datetime.date(2017, 5, 22)
    >>> date_val(TEST_DATETIME_TZ)
    datetime.date(2017, 5, 22)
    >>> date_val('2017-05-22')
    datetime.date(2017, 5, 22)

Invalid formats, dates, or types are rejected::

    >>> date_val('2017-02-30')
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid date in the format YYYY-MM-DD
    Got:
        '2017-02-30'

    >>> date_val('foobar')
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid date in the format YYYY-MM-DD
    Got:
        'foobar'

    >>> date_val(123)
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid date in the format YYYY-MM-DD
    Got:
        123

    >>> date_val(True)
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid date in the format YYYY-MM-DD
    Got:
        True

``DateVal`` can parse YAML documents::

    >>> date_val.parse(""" 2017-05-22 """)
    datetime.date(2017, 5, 22)
    >>> date_val.parse(""" !!timestamp 2017-05-22 """)
    datetime.date(2017, 5, 22)
    >>> date_val.parse(""" !!timestamp 2017-05-22T12:34:56 """)
    datetime.date(2017, 5, 22)


``TimeVal``
===========

``TimeVal`` validates ISO8601-formatted times and compatible objects and
returns them as ``datetime.time`` objects::

    >>> from rex.core import TimeVal
    >>> time_val = TimeVal()

    >>> time_val(TEST_TIME)
    datetime.time(12, 34, 56, 789)
    >>> time_val(TEST_TIME_TZ)
    datetime.time(12, 34, 56, 789)
    >>> time_val(TEST_DATETIME)
    datetime.time(12, 34, 56, 789)
    >>> time_val(TEST_DATETIME_TZ)
    datetime.time(11, 34, 56, 789)
    >>> time_val('12:34:56')
    datetime.time(12, 34, 56)
    >>> time_val('12:34:56.000789')
    datetime.time(12, 34, 56, 789)

Invalid formats, times, or types are rejected::

    >>> time_val('12:99:56')
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid time in the format HH:MM:SS[.FFFFFF]
    Got:
        '12:99:56'

    >>> time_val('foobar')
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid time in the format HH:MM:SS[.FFFFFF]
    Got:
        'foobar'

    >>> time_val(123)
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid time in the format HH:MM:SS[.FFFFFF]
    Got:
        123

    >>> time_val(True)
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid time in the format HH:MM:SS[.FFFFFF]
    Got:
        True

``TimeVal`` can parse YAML documents::

    >>> time_val.parse(""" 12:34:56 """)
    datetime.time(12, 34, 56)
    >>> time_val.parse(""" 12:34:56.000789 """)
    datetime.time(12, 34, 56, 789)


``DateTimeVal``
===============

``DateTimeVal`` validates ISO8601-formatted datetimes and compatible objects
and returns them as ``datetime.datetime`` objects::

    >>> from rex.core import DateTimeVal
    >>> dt_val = DateTimeVal()

    >>> dt_val(TEST_DATETIME)
    datetime.datetime(2017, 5, 22, 12, 34, 56, 789)
    >>> dt_val(TEST_DATETIME_TZ)
    datetime.datetime(2017, 5, 22, 11, 34, 56, 789)
    >>> dt_val(TEST_DATE)
    datetime.datetime(2017, 5, 22, 0, 0)
    >>> dt_val('2017-05-22T12:34:56.000789')
    datetime.datetime(2017, 5, 22, 12, 34, 56, 789)
    >>> dt_val('2017-05-22T12:34:56')
    datetime.datetime(2017, 5, 22, 12, 34, 56)
    >>> dt_val('2017-05-22')
    datetime.datetime(2017, 5, 22, 0, 0)
    >>> dt_val('2017-05-22T12:34:56Z')
    datetime.datetime(2017, 5, 22, 12, 34, 56)
    >>> dt_val('2017-05-22T12:34:56+0230')
    datetime.datetime(2017, 5, 22, 10, 4, 56)
    >>> dt_val('2017-05-22T12:34:56.000789+0230')
    datetime.datetime(2017, 5, 22, 10, 4, 56, 789)
    >>> dt_val('2017-05-22T12:34:56.000789+02:30')
    datetime.datetime(2017, 5, 22, 10, 4, 56, 789)

Invalid formats, dates/times, or types are rejected::

    >>> dt_val('2015-02-30T12:34:56')
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS[.FFFFFF][+-HH:MM]
    Got:
        '2015-02-30T12:34:56'

    >>> dt_val('2015-02-30')
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS[.FFFFFF][+-HH:MM]
    Got:
        '2015-02-30'

    >>> dt_val('2015-01-01T12:99:56')
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS[.FFFFFF][+-HH:MM]
    Got:
        '2015-01-01T12:99:56'

    >>> dt_val('foobar')
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS[.FFFFFF][+-HH:MM]
    Got:
        'foobar'

    >>> dt_val(123)
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS[.FFFFFF][+-HH:MM]
    Got:
        123

    >>> dt_val(True)
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a valid date/time in the format YYYY-MM-DDTHH:MM:SS[.FFFFFF][+-HH:MM]
    Got:
        True

``DateTimeVal`` can parse YAML documents::

    >>> dt_val.parse(""" 2017-05-22 """)
    datetime.datetime(2017, 5, 22, 0, 0)
    >>> dt_val.parse(""" !!timestamp 2017-05-22 """)
    datetime.datetime(2017, 5, 22, 0, 0)
    >>> dt_val.parse(""" 2017-05-22T12:34:56 """)
    datetime.datetime(2017, 5, 22, 12, 34, 56)
    >>> dt_val.parse(""" !!timestamp 2017-05-22T12:34:56 """)
    datetime.datetime(2017, 5, 22, 12, 34, 56)
    >>> dt_val.parse(""" !!timestamp 2017-05-22T12:34:56+01:00 """)
    datetime.datetime(2017, 5, 22, 11, 34, 56)


Records and locations
=====================

``Record`` is used to create record types with a fixed set of fields::

    >>> from rex.core import Record
    >>> Person = Record.make('Person', ['name', 'age'])

You can use this type to create record objects::

    >>> p1 = Person("Alice", 33)
    >>> p1
    Person(name='Alice', age=33)
    >>> p2 = Person(name="Bob", age=81)
    >>> p2
    Person(name='Bob', age=81)

Invalid records are rejected::

    >>> Person("Clarence")
    Traceback (most recent call last):
      ...
    TypeError: missing field 'age'
    >>> Person("Daniel", 56, sex='m')
    Traceback (most recent call last):
      ...
    TypeError: unknown field 'sex'
    >>> Person("Eleonore", 18, age=18)
    Traceback (most recent call last):
      ...
    TypeError: duplicate field 'age'
    >>> Person("Fiona", 3, 'f')
    Traceback (most recent call last):
      ...
    TypeError: expected 2 arguments, got 3

Record fields could be accessed by name or by index::

    >>> p1.name
    'Alice'
    >>> p1['name']
    'Alice'
    >>> p1[0]
    'Alice'

Unknown keys are rejected::

    >>> p1['sex']
    Traceback (most recent call last):
      ...
    KeyError: 'sex'

A record can be easily converted to a dictionary::

    >>> vars(p1)
    OrderedDict([('name', 'Alice'), ('age', 33)])

Records are compared by value and can be used as keys in a dictionary::

    >>> p1 == Person("Alice", 33)
    True
    >>> p1 != p2
    True
    >>> p1 in { Person("Alice", 33): False }
    True

Records could be cloned with updated field values::

    >>> p1.__clone__()
    Person(name='Alice', age=33)
    >>> p1.__clone__(age=p1.age+1)
    Person(name='Alice', age=34)
    >>> p1.__clone__(sex='f')
    Traceback (most recent call last):
      ...
    TypeError: unknown field 'sex'

Records generated from a YAML file with ``RecordVal.parse()`` are associated
with a position in the YAML file::

    >>> from rex.core import locate
    >>> p3 = record_val.parse(""" { name: Alice, age: 33 } """)
    >>> location = locate(p3)
    >>> location
    Location('<unicode string>', 0)
    >>> print(location)
    "<unicode string>", line 1

Records that are generated manually has no associated location::

    >>> locate(p1) is None
    True

Use function ``set_location()`` to reassign record locations::

    >>> from rex.core import set_location
    >>> set_location(p1, p2)
    >>> locate(p1) is None
    True
    >>> set_location(p1, p3)
    >>> locate(p1)
    Location('<unicode string>', 0)

Cloned records inherit their location from the original record::

    >>> locate(p1.__clone__(age=p1.age+1))
    Location('<unicode string>', 0)


``!include``
============

In YAML documents, you can use tags ``!include`` and ``!include/str`` for
loading content from external files.  Files that are included using
``!include`` tag are interpreted as YAML documents.  Files included using
``!include/str`` are interpreted as literal data::

    >>> from rex.core import SandboxPackage

    >>> sandbox = SandboxPackage()
    >>> sandbox.rewrite('include.me', """ [We, love, YAML] """)
    >>> sandbox.rewrite('include.yaml', """ !include include.me """)
    >>> sandbox.rewrite('include-str.yaml', """ !include/str include.me """)

    >>> seq_val = SeqVal(StrVal)
    >>> seq_val.parse(sandbox.open('include.yaml'))
    ['We', 'love', 'YAML']

    >>> str_val = StrVal()
    >>> str_val.parse(sandbox.open('include-str.yaml'))
    ' [We, love, YAML] '

It is possible to include a sub-structure of a mapping from an included YAML
file::

    >>> sandbox.rewrite('include.me.too', """ { We : { love : YAML }, Not: XML } """)
    >>> sandbox.rewrite('include-pointer.yaml', """ !include include.me.too#/We/love/ """)

    >>> str_val.parse(sandbox.open('include-pointer.yaml'))
    'YAML'

It is an error when the mapping key does not exist, or the content
of the document is not a mapping::

    >>> sandbox.rewrite('include-pointer.yaml', """ !include include.me.too#/We/hate/ """)
    >>> str_val.parse(sandbox.open('include-pointer.yaml'))     # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a mapping with a key:
        hate
    While parsing:
        "/.../include.me.too", line 1
    While processing !include directive:
        "/.../include-pointer.yaml", line 1

    >>> sandbox.rewrite('include-pointer.yaml', """ !include include.me#/We/love/ """)
    >>> str_val.parse(sandbox.open('include-pointer.yaml'))     # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a mapping
    Got:
        a sequence
    While parsing:
        "/.../include.me", line 1
    While processing !include directive:
        "/.../include-pointer.yaml", line 1

It is not allowed to use the pointer syntax with string includes::

    >>> sandbox.rewrite('include-pointer.yaml', """ !include/str include.me.too#/We/love/ """)
    >>> str_val.parse(sandbox.open('include-pointer.yaml'))     # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        unexpected pointer: #/We/love/
          in "/.../include-pointer.yaml", line 1, column 2

The pointer extractor is implemented as a validator, which can be used
directly::

    >>> from rex.core import IncludeKeyVal

    >>> include_key_val = IncludeKeyVal('key', str_val)
    >>> include_key_val
    IncludeKeyVal('key', StrVal())

    >>> include_key_val({"key": "value"})
    'value'

    >>> include_key_val({"no": "value"})
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a mapping with a key:
        key

    >>> include_key_val(None)
    Traceback (most recent call last):
      ...
    rex.core.Error: Expected a mapping

The include key validator is hashable and comparable::

    >>> other_include_key_val = IncludeKeyVal('key', str_val)

    >>> hash(include_key_val) == hash(other_include_key_val)
    True
    >>> include_key_val == other_include_key_val
    True
    >>> include_key_val != other_include_key_val
    False

An empty YAML stream is interpreted as a ``null`` value::

    >>> sandbox.rewrite('include.me', """ """)
    >>> seq_val.parse(sandbox.open('include.yaml'))
    []
    >>> str_val.parse(sandbox.open('include-str.yaml'))
    ' '

Invalid ``!include`` directives are rejected::

    >>> any_val = AnyVal()

    >>> any_val.parse(""" !include """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        expected a file name, but found an empty node
          in "<unicode string>", line 1, column 2

    >>> any_val.parse(""" !include [] """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        expected a file name, but found sequence
          in "<unicode string>", line 1, column 2

    >>> any_val.parse(""" !include not-found.yaml """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        unable to resolve relative path: not-found.yaml
          in "<unicode string>", line 1, column 2

    >>> any_val.parse(""" !include /not-found.yaml """)
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        unable to open file: /not-found.yaml
          in "<unicode string>", line 1, column 2


``!setting``
============

If you read a YAML file from an active Rex application, you can
set the value of a YAML node from a setting::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.core_demo', demo_folder='demo')
    >>> demo.on()

    >>> sandbox.rewrite('setting.yaml', """ !setting demo_folder """)

    >>> any_val.parse(sandbox.open('setting.yaml'))
    'demo'

The node content after ``!setting`` tag must be a valid setting name::

    >>> sandbox.rewrite('setting.yaml', """ !setting {} """)
    >>> any_val.parse(sandbox.open('setting.yaml'))             # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        expected a setting name, but found mapping
          in "/.../setting.yaml", line 1, column 2

    >>> sandbox.rewrite('setting.yaml', """ !setting unknown """)
    >>> any_val.parse(sandbox.open('setting.yaml'))             # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Got unknown setting:
        unknown
    While parsing:
        "/.../setting.yaml", line 1

It is an error to use ``!setting`` when no Rex application is active::

    >>> demo.off()

    >>> sandbox.rewrite('setting.yaml', """ !setting demo_folder """)
    >>> any_val.parse(sandbox.open('setting.yaml'))             # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        cannot read a setting value without an active Rex application
          in "/.../setting.yaml", line 1, column 2


``!include/python``
===================

You can use Python objects as constants in your YAML documents with the help
of the ``!include/python`` tags::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.core_demo', demo_folder='demo')
    >>> demo.on()
    >>> FOO = 'BAR'

    >>> sandbox.rewrite('setting.yaml',
    ...                 """bar_is: !include/python rex.core_demo:FOO """)

    >>> any_val.parse(sandbox.open('setting.yaml'))
    {'bar_is': 'BAR'}

If the object imported is callable - it will be called::

    >>> sandbox.rewrite('setting.yaml',
    ...                 """pkg: !include/python rex.core_demo:main_package """)

    >>> any_val.parse(sandbox.open('setting.yaml'))
    {'pkg': 'rex.core_demo'}

Be careful when specifying an object::

    >>> sandbox.rewrite('setting.yaml',
    ...                 """pkg: !include/python {module: rex.core_demo, object: FOO} """)

    >>> any_val.parse(sandbox.open('setting.yaml'))            # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse a YAML document:
        expected a 'module:object' string, but found mapping
          in "/.../setting.yaml", line 1, column 6

    >>> sandbox.rewrite('setting.yaml',
    ...                 """pkg: !include/python rex.core_demo.FOO """)

    >>> any_val.parse(sandbox.open('setting.yaml'))            # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Unknown python object format. Expected 'module:object'
        rex.core_demo.FOO
    ...

    >>> sandbox.rewrite('setting.yaml',
    ...                 """pkg: !include/python rex.core.demo:FOO """)

    >>> any_val.parse(sandbox.open('setting.yaml'))            # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Cannot import 'FOO' from 'rex.core.demo'
        rex.core.demo:FOO
    ...

    >>> sandbox.rewrite('setting.yaml',
    ...                 """pkg: !include/python rex.core_demo:FO """)

    >>> any_val.parse(sandbox.open('setting.yaml'))            # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    rex.core.Error: Cannot import 'FO' from 'rex.core_demo'
        rex.core_demo:FO
    ...

