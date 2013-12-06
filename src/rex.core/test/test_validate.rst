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
    Error: Expected an integer
    Got:
        'NaN'

A validator can also be used to parse YAML documents::

    >>> int_val.parse("""
    ... ---
    ... -8
    ... """)
    -8


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

Ill-formed YAML documents raise ``rex.core.Error`` exception::

    >>> any_val.parse(""" : """)
    Traceback (most recent call last):
      ...
    Error: Failed to parse a YAML document:
        while parsing a block mapping
        did not find expected key
          in "<byte string>", line 1, column 2


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
    Error: Expected an integer
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
    Error: Expected an integer
    Got:
        NaN
    While parsing:
        "<byte string>", line 1


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
    Error: Failed to match the value against any of the following:
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


``StrVal``, ``UStrVal``
=======================

``StrVal`` accepts 8-bit and Unicode strings.  8-bit strings are expected to be
in UTF-8 encoding.  The output is always an 8-bit string in UTF-8 encoding::

    >>> from rex.core import StrVal
    >>> str_val = StrVal()
    >>> str_val
    StrVal()
    >>> str_val('Hello')
    'Hello'
    >>> str_val(u'Hello')
    'Hello'
    >>> str_val(None)
    Traceback (most recent call last):
      ...
    Error: Expected a string
    Got:
        None
    >>> str_val(u'\N{CYRILLIC CAPITAL LETTER YA}')
    '\xd0\xaf'
    >>> str_val(u'\N{CYRILLIC CAPITAL LETTER YA}'.encode('utf-8'))
    '\xd0\xaf'
    >>> str_val(u'\N{CYRILLIC CAPITAL LETTER YA}'.encode('cp1251'))
    Traceback (most recent call last):
      ...
    Error: Expected a valid UTF-8 string
    Got:
        '\xdf'

Use ``UStrVal`` if you want to get Unicode strings::

    >>> from rex.core import UStrVal
    >>> ustr_val = UStrVal()
    >>> ustr_val('Hello')
    u'Hello'
    >>> ustr_val(u'Hello')
    u'Hello'

``StrVal`` can also parse YAML documents::

    >>> str_val.parse(""" Hello """)
    'Hello'
    >>> str_val.parse(""" null """)
    Traceback (most recent call last):
      ...
    Error: Expected a string
    Got:
        null
    While parsing:
        "<byte string>", line 1
    >>> str_val.parse(""" [] """)
    Traceback (most recent call last):
      ...
    Error: Expected a string
    Got:
        a sequence
    While parsing:
        "<byte string>", line 1

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
    Error: Expected a string matching:
        /\d\d\d-\d\d-\d\d\d\d/
    Got:
        'John Doe'

The whole input must match the pattern::

    >>> ssn_val('123-12-1234 John Doe')
    Traceback (most recent call last):
      ...
    Error: Expected a string matching:
        /\d\d\d-\d\d-\d\d\d\d/
    Got:
        '123-12-1234 John Doe'


``ChoiceVal``, ``UChoiceVal``
=============================

``ChoiceVal`` accepts strings from a predefined set of values::

    >>> from rex.core import ChoiceVal
    >>> choice_val = ChoiceVal('one', 'two', 'three')
    >>> choice_val
    ChoiceVal('one', 'two', 'three')
    >>> choice_val('two')
    'two'
    >>> choice_val(u'two')
    'two'
    >>> choice_val(2)
    Traceback (most recent call last):
      ...
    Error: Expected a string
    Got:
        2
    >>> choice_val('five')
    Traceback (most recent call last):
      ...
    Error: Expected one of:
        one, two, three
    Got:
        'five'

``ChoiceVal`` also accepts a list of values::

    >>> ChoiceVal(['one', 'two', 'three'])
    ChoiceVal('one', 'two', 'three')

Use ``UChoiceVal`` if you want to get a Unicode string as a result::

    >>> from rex.core import UChoiceVal
    >>> uchoice_val = UChoiceVal(u'one', u'two', u'three')
    >>> uchoice_val('two')
    u'two'
    >>> uchoice_val(u'two')
    u'two'

``ChoiceVal`` can parse YAML documents::

    >>> choice_val.parse(""" two """)
    'two'
    >>> choice_val.parse(""" 2 """)
    Traceback (most recent call last):
      ...
    Error: Expected a string
    Got:
        2
    While parsing:
        "<byte string>", line 1


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
    Error: Expected a Boolean value
    Got:
        None

``BoolVal`` can parse YAML documents::

    >>> bool_val.parse(""" false """)
    False
    >>> bool_val.parse(""" null """)
    Traceback (most recent call last):
      ...
    Error: Expected a Boolean value
    Got:
        null
    While parsing:
        "<byte string>", line 1


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
    >>> int_val(10L)
    10L
    >>> int_val('10')
    10
    >>> int_val('NaN')
    Traceback (most recent call last):
      ...
    Error: Expected an integer
    Got:
        'NaN'
    >>> int_val(None)
    Traceback (most recent call last):
      ...
    Error: Expected an integer
    Got:
        None

``IntVal`` can parse YAML documents::

    >>> int_val.parse(""" 10 """)
    10
    >>> int_val.parse(""" NaN """)
    Traceback (most recent call last):
      ...
    Error: Expected an integer
    Got:
        NaN
    While parsing:
        "<byte string>", line 1

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
    Error: Expected an integer in range:
        [1..10]
    Got:
        0
    >>> int_1to10_val(11)
    Traceback (most recent call last):
      ...
    Error: Expected an integer in range:
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
    Error: Expected an integer in range:
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
    Error: Expected an integer in range:
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
    Error: Expected an integer in range:
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
    Error: Expected an integer in range:
        [0..]
    Got:
        -1


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
    Error: Expected a sequence
    Got:
        None

If you pass a string, it must be a valid JSON array::

    >>> seq_val('[-:]')
    Traceback (most recent call last):
      ...
    Error: Expected a JSON array
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
    Error: Expected an integer
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
    Error: Expected a sequence
    Got:
        null
    While parsing:
        "<byte string>", line 1

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
    Error: Expected an integer
    Got:
        False
    While validating sequence item
        #2
    >>> one_or_seq_val('NaN')
    Traceback (most recent call last):
      ...
    Error: Expected an integer
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
    Error: Expected a mapping
    Got:
        None

If you pass a string, it must be a valid JSON object::

    >>> map_val('{-:}')
    Traceback (most recent call last):
      ...
    Error: Expected a JSON object
    Got:
        '{-:}'
    >>> map_val('{"0": false}')
    {u'0': False}

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
    Error: Expected an integer in range:
        [1..]
    Got:
        '0'
    While validating mapping key:
        '0'
    >>> i2i_map_val = MapVal(IntVal, IntVal)
    >>> i2i_map_val({'0': 'false'})
    Traceback (most recent call last):
      ...
    Error: Expected an integer
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
    Error: Expected a mapping
    Got:
        null
    While parsing:
        "<byte string>", line 1

``MapVal`` can detect ill-formed YAML mappings::

    >>> map_val.parse(""" { {}: {} } """)
    Traceback (most recent call last):
      ...
    Error: Failed to parse a YAML document:
        while constructing a mapping
          in "<byte string>", line 1, column 2
        found an unacceptable key (unhashable type: 'dict')
          in "<byte string>", line 1, column 4
    >>> map_val.parse(""" { key: value, key: value } """)
    Traceback (most recent call last):
      ...
    Error: Failed to parse a YAML document:
        while constructing a mapping
          in "<byte string>", line 1, column 2
        found a duplicate key
          in "<byte string>", line 1, column 16

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
    Error: Expected an ordered mapping
    Got:
        None
    >>> omap_val([(1, 2, 3)])
    Traceback (most recent call last):
      ...
    Error: Expected an ordered mapping
    Got:
        [(1, 2, 3)]
    >>> omap_val([{}])
    Traceback (most recent call last):
      ...
    Error: Expected an ordered mapping
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
    Error: Expected a JSON object
    Got:
        '{-:}'
    >>> omap_val('{"0": false, "1": true}')
    OrderedDict([(u'0', False), (u'1', True)])

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
    Error: Expected an integer in range:
        [1..]
    Got:
        '0'
    While validating mapping key:
        '0'
    >>> i2i_omap_val = OMapVal(IntVal, IntVal)
    >>> i2i_omap_val([{'0': 'false'}])
    Traceback (most recent call last):
      ...
    Error: Expected an integer
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
    Error: Expected an ordered mapping
    Got:
        null
    While parsing:
        "<byte string>", line 1

``MapVal`` can detect ill-formed ordered mappings in a YAML document::

    >>> omap_val.parse(""" [ null ] """)
    Traceback (most recent call last):
      ...
    Error: Expected an entry of an ordered mapping
    Got:
        null
    While parsing:
        "<byte string>", line 1
    >>> omap_val.parse(""" [ {} ] """)
    Traceback (most recent call last):
      ...
    Error: Expected an entry of an ordered mapping
    Got:
        a mapping
    While parsing:
        "<byte string>", line 1
    >>> omap_val.parse(""" [ {}: {} ] """)
    Traceback (most recent call last):
      ...
    Error: Failed to parse a YAML document:
        while constructing a mapping
          in "<byte string>", line 1, column 2
        found an unacceptable key (unhashable type: 'dict')
          in "<byte string>", line 1, column 4

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
    Error: Expected a mapping
    Got:
        ('Bob', 'm', 12)
    >>> import collections
    >>> Person = collections.namedtuple("Person", "name sex")
    >>> record_val(Person("Clarence", 'm'))
    Traceback (most recent call last):
      ...
    Error: Expected a record with fields:
        name, age
    Got:
        Person(name='Clarence', sex='m')
    >>> record_val("David")
    Traceback (most recent call last):
      ...
    Error: Expected a JSON object
    Got:
        'David'

Optional fields can be omitted, but mandatory cannot be::

    >>> record_val({'name': "Bob"})
    Record(name='Bob', age=None)
    >>> record_val({'age': 81})
    Traceback (most recent call last):
      ...
    Error: Missing mandatory field:
        name

Unexpected fields are rejected::

    >>> record_val({'name': "Eleonore", 'sex': 'f'})
    Traceback (most recent call last):
      ...
    Error: Got unexpected field:
        sex

Invalid field values are reported::

    >>> record_val({'name': "Fiona", 'age': False})
    Traceback (most recent call last):
      ...
    Error: Expected an integer
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
    Error: Expected a mapping
    Got:
        null
    While parsing:
        "<byte string>", line 1

``RecordVal`` accepts missing optional fields, but reports duplicate, unknown
or missing mandatory fields in a YAML document::

    >>> record_val.parse(""" { name: Bob } """)
    Record(name='Bob', age=None)
    >>> record_val.parse(""" { name: Alice, name: Bob } """)
    Traceback (most recent call last):
      ...
    Error: Got duplicate field:
        name
    While parsing:
        "<byte string>", line 1
    >>> record_val.parse(""" { name: Eleonore, sex: f } """)
    Traceback (most recent call last):
      ...
    Error: Got unexpected field:
        sex
    While parsing:
        "<byte string>", line 1
    >>> record_val.parse(""" { age: 81 } """)
    Traceback (most recent call last):
      ...
    Error: Missing mandatory field:
        name
    While parsing:
        "<byte string>", line 1

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
    Error: Expected an integer
    Got:
        false
    While parsing:
        "<byte string>", line 1
    While validating field:
        age


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
    Error: Cannot recognize a record
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
    Error: Cannot recognize a record
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
    Error: Expected an integer
    Got:
        'Bob'

``SwitchVal`` can parse YAML documents::

    >>> switch_val.parse(""" { name: Alice, age: 33 } """)
    Record(name='Alice', age=33)
    >>> switch_val.parse(""" null """)
    Traceback (most recent call last):
      ...
    Error: Expected a mapping
    Got:
        null
    While parsing:
        "<byte string>", line 1

``SwitchVal`` rejects or uses the default validator to parse YAML nodes it
cannot recognize::

    >>> switch_val.parse(""" { age: 81 } """)
    Traceback (most recent call last):
      ...
    Error: Cannot recognize a record
    While parsing:
        "<byte string>", line 1
    >>> default_switch_val.parse(""" { true: false } """)
    Traceback (most recent call last):
      ...
    Error: Expected an integer
    Got:
        a mapping
    While parsing:
        "<byte string>", line 1
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
    Error: Expected one of:
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

``UnionVal`` understands serialized JSON objects and named tuples::

    >>> record_union_val('{"name": "Alice", "age": 33}')
    Record(name='Alice', age=33)
    >>> record_union_val(_)
    Record(name='Alice', age=33)

Without the default validator, unexpected values are rejected::

    >>> record_union_val({'age': 81})
    Traceback (most recent call last):
      ...
    Error: Expected one of:
        name record
    Got:
        {'age': 81}
    >>> record_union_val('-')
    Traceback (most recent call last):
      ...
    Error: Expected one of:
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
    Error: Expected an integer
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
    Error: Expected one of:
        name record
    Got:
        a mapping
    While parsing:
        "<byte string>", line 1


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
    Location('<byte string>', 0)
    >>> print location
    "<byte string>", line 1

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
    Location('<byte string>', 0)

Cloned records inherit their location from the original record::

    >>> locate(p1.__clone__(age=p1.age+1))
    Location('<byte string>', 0)


