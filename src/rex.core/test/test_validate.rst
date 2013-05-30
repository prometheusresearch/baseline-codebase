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


``MaybeVal``
============

``MaybeVal`` works as a wrapper around another validator.  It accepts all
values accepted by the wrapped validator *and* ``None``::

    >>> from rex.core import MaybeVal, IntVal
    >>> maybe_val = MaybeVal(IntVal())
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


``StrVal``
==========

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

``StrVal`` constructor takes an optional argument: a regular expression
pattern.  When the pattern is provided, only input strings that match this
pattern are accepted::

    >>> ssn_val = StrVal(r'^\d\d\d-\d\d-\d\d\d\d$')
    >>> ssn_val
    StrVal('^\\d\\d\\d-\\d\\d-\\d\\d\\d\\d$')
    >>> ssn_val('123-12-1234')
    '123-12-1234'
    >>> ssn_val('John Doe')
    Traceback (most recent call last):
      ...
    Error: Expected a string matching:
        /^\d\d\d-\d\d-\d\d\d\d$/
    Got:
        'John Doe'


``ChoiceVal``
=============

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

``SeqVal`` has an optional parameter: a validator to apply to sequence items::

    >>> from rex.core import IntVal
    >>> int_seq_val = SeqVal(IntVal())
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

``MapVal`` constructor takes two optional parameters: validators for mapping
keys and mapping values::

    >>> from rex.core import IntVal, PIntVal, BoolVal
    >>> i2b_map_val = MapVal(IntVal(), BoolVal())
    >>> i2b_map_val
    MapVal(IntVal(), BoolVal())
    >>> i2b_map_val({})
    {}
    >>> i2b_map_val({'0': 'false'})
    {0: False}
    >>> pi2b_map_val = MapVal(PIntVal(), BoolVal())
    >>> pi2b_map_val({'0': 'false'})
    Traceback (most recent call last):
      ...
    Error: Expected an integer in range:
        [1..]
    Got:
        '0'
    While validating mapping key:
        '0'
    >>> i2i_map_val = MapVal(IntVal(), IntVal())
    >>> i2i_map_val({'0': 'false'})
    Traceback (most recent call last):
      ...
    Error: Expected an integer
    Got:
        'false'
    While validating mapping value for key:
        0


``FileVal``, ``DirectoryVal``
=============================

``FileVal`` and ``DirectoryVal`` check that the input value is a path to an
existing file or directory respectively::

    >>> from rex.core import FileVal, DirectoryVal
    >>> file_val = FileVal()
    >>> file_val
    FileVal()
    >>> file_val('setup.py')
    'setup.py'
    >>> file_val(u'setup.py')
    'setup.py'
    >>> file_val('missing')
    Traceback (most recent call last):
      ...
    Error: Cannot find file:
        missing
    >>> file_val('src')
    Traceback (most recent call last):
      ...
    Error: Cannot find file:
        src
    >>> file_val(None)
    Traceback (most recent call last):
      ...
    Error: Expected a string
    Got:
        None
    >>> dir_val = DirectoryVal()
    >>> dir_val
    DirectoryVal()
    >>> dir_val('src')
    'src'
    >>> dir_val(u'src')
    'src'
    >>> dir_val('missing')
    Traceback (most recent call last):
      ...
    Error: Cannot find directory:
        missing
    >>> dir_val('setup.py')
    Traceback (most recent call last):
      ...
    Error: Cannot find directory:
        setup.py
    >>> dir_val(None)
    Traceback (most recent call last):
      ...
    Error: Expected a string
    Got:
        None


