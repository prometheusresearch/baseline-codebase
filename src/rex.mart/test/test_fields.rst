*****************
Assessment Fields
*****************


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()
    >>> from rex.mart.fields import *
    >>> from pprint import pprint
    >>> from types import NoneType
    >>> from decimal import Decimal
    >>> from datetime import date, time, datetime
    >>> DATE = date(2015, 5, 22)
    >>> TIME = time(12, 34, 56)
    >>> DATETIME = datetime(2015, 5, 22, 12, 34, 56)

    >>> def run_merge_tests(type_base, vectors):
    ...     for i in range(len(vectors)):
    ...         field = make_field({'id': 'test', 'type': type_base}, instrument_version='0')
    ...         table = {}
    ...         merge_field_into(table, field)
    ...         for j in range(i+1):
    ...             new_field = make_field({'id': 'test', 'type': vectors[j][0]}, instrument_version=str(j+1))
    ...             merge_field_into(table, new_field)
    ...         for j in range(i+1):
    ...             value = table['test'].map_assessment_value({'value': vectors[j][1]}, instrument_version=str(j+1))
    ...             assert value == vectors[j][2], 'Got %r, expected %r' % (value, vectors[j][2])


TextField
=========

::

    >>> field = TextField('test')
    >>> pprint(field.get_deploy_facts('some_table'))
    [{'column': u'test', 'of': 'some_table', 'required': False, 'type': 'text'}]

    >>> field.get_value_mapping(None)
    {u'test': None}
    >>> field.get_value_mapping('foo')
    {u'test': u'foo'}
    >>> field.get_value_mapping('foo')
    {u'test': u'foo'}
    >>> field.get_value_mapping(1)
    {u'test': u'1'}
    >>> field.get_value_mapping(1.23)
    {u'test': u'1.23'}
    >>> field.get_value_mapping(Decimal('1.23'))
    {u'test': u'1.23'}
    >>> field.get_value_mapping(True)
    {u'test': u'TRUE'}
    >>> field.get_value_mapping(False)
    {u'test': u'FALSE'}
    >>> field.get_value_mapping(DATE)
    {u'test': u'2015-05-22'}
    >>> field.get_value_mapping(TIME)
    {u'test': u'12:34:56'}
    >>> field.get_value_mapping(DATETIME)
    {u'test': u'2015-05-22T12:34:56'}

    >>> TEXT_MERGE_VECTORS = (
    ...     ({'base': 'text'}, 'foo', 'foo'),
    ...     ({'base': 'integer'}, 123, '123'),
    ...     ({'base': 'float'}, 1.23, '1.23'),
    ...     ({'base': 'boolean'}, True, 'TRUE'),
    ...     ({'base': 'date'}, '2015-05-22', '2015-05-22'),
    ...     ({'base': 'time'}, '12:34:56', '12:34:56'),
    ...     ({'base': 'dateTime'}, '2015-05-22T12:34:56', '2015-05-22T12:34:56'),
    ...     ({'base': 'enumeration', 'enumerations': {'foo':{},'bar':{}}}, 'foo', 'foo'),
    ... )
    >>> run_merge_tests({'base': 'text'}, TEXT_MERGE_VECTORS)


IntegerField
============

::

    >>> field = IntegerField('test')
    >>> pprint(field.get_deploy_facts('some_table'))
    [{'column': u'test', 'of': 'some_table', 'required': False, 'type': 'integer'}]

    >>> field.get_value_mapping(None)
    {u'test': None}
    >>> field.get_value_mapping('foo')
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "integer": 'foo'
    >>> field.get_value_mapping('1')
    {u'test': 1}
    >>> field.get_value_mapping(1)
    {u'test': 1}
    >>> field.get_value_mapping(1.23)
    {u'test': 1}
    >>> field.get_value_mapping(Decimal('1.23'))
    {u'test': 1}
    >>> field.get_value_mapping(True)
    {u'test': 1}
    >>> field.get_value_mapping(False)
    {u'test': 0}
    >>> field.get_value_mapping(DATE)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "integer": datetime.date(2015, 5, 22)
    >>> field.get_value_mapping(TIME)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "integer": datetime.time(12, 34, 56)
    >>> field.get_value_mapping(DATETIME)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "integer": datetime.datetime(2015, 5, 22, 12, 34, 56)

    >>> INTEGER_MERGE_VECTORS = (
    ...     ({'base': 'integer'}, 123, 123),
    ...     ({'base': 'boolean'}, True, 1),
    ... )
    >>> run_merge_tests({'base': 'integer'}, INTEGER_MERGE_VECTORS)


FloatField
==========

::

    >>> field = FloatField('test')
    >>> pprint(field.get_deploy_facts('some_table'))
    [{'column': u'test', 'of': 'some_table', 'required': False, 'type': 'float'}]

    >>> field.get_value_mapping(None)
    {u'test': None}
    >>> field.get_value_mapping('foo')
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "float": 'foo'
    >>> field.get_value_mapping('1')
    {u'test': 1.0}
    >>> field.get_value_mapping(1.0)
    {u'test': 1.0}
    >>> field.get_value_mapping(1.23)
    {u'test': 1.23}
    >>> field.get_value_mapping(Decimal('1.23'))
    {u'test': 1.23}
    >>> field.get_value_mapping(True)
    {u'test': 1.0}
    >>> field.get_value_mapping(False)
    {u'test': 0.0}
    >>> field.get_value_mapping(DATE)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "float": datetime.date(2015, 5, 22)
    >>> field.get_value_mapping(TIME)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "float": datetime.time(12, 34, 56)
    >>> field.get_value_mapping(DATETIME)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "float": datetime.datetime(2015, 5, 22, 12, 34, 56)

    >>> FLOAT_MERGE_VECTORS = (
    ...     ({'base': 'float'}, 1.23, 1.23),
    ...     ({'base': 'integer'}, 123, 123.0),
    ...     ({'base': 'boolean'}, True, 1.0),
    ... )
    >>> run_merge_tests({'base': 'float'}, FLOAT_MERGE_VECTORS)


BooleanField
============

::

    >>> field = BooleanField('test')
    >>> pprint(field.get_deploy_facts('some_table'))
    [{'column': u'test', 'of': 'some_table', 'required': False, 'type': 'boolean'}]

    >>> field.get_value_mapping(None)
    {u'test': None}
    >>> field.get_value_mapping('foo')
    {u'test': True}
    >>> field.get_value_mapping('foo')
    {u'test': True}
    >>> field.get_value_mapping('')
    {u'test': False}
    >>> field.get_value_mapping(1)
    {u'test': True}
    >>> field.get_value_mapping(0)
    {u'test': False}
    >>> field.get_value_mapping(1.23)
    {u'test': True}
    >>> field.get_value_mapping(Decimal('1.23'))
    {u'test': True}
    >>> field.get_value_mapping(0.0)
    {u'test': False}
    >>> field.get_value_mapping(True)
    {u'test': True}
    >>> field.get_value_mapping(False)
    {u'test': False}
    >>> field.get_value_mapping(DATE)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "boolean": datetime.date(2015, 5, 22)
    >>> field.get_value_mapping(TIME)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "boolean": datetime.time(12, 34, 56)
    >>> field.get_value_mapping(DATETIME)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "boolean": datetime.datetime(2015, 5, 22, 12, 34, 56)

    >>> BOOL_MERGE_VECTORS = (
    ...     ({'base': 'boolean'}, True, True),
    ...     ({'base': 'boolean'}, False, False),
    ... )
    >>> run_merge_tests({'base': 'boolean'}, BOOL_MERGE_VECTORS)


DateField
=========

::

    >>> field = DateField('test')
    >>> pprint(field.get_deploy_facts('some_table'))
    [{'column': u'test', 'of': 'some_table', 'required': False, 'type': 'date'}]

    >>> field.get_value_mapping(None)
    {u'test': None}
    >>> field.get_value_mapping('foo')
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "date": 'foo'
    >>> field.get_value_mapping('foo')
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "date": u'foo'
    >>> field.get_value_mapping(1)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "date": 1
    >>> field.get_value_mapping(1.23)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "date": 1.23
    >>> field.get_value_mapping(Decimal('1.23'))
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "date": Decimal('1.23')
    >>> field.get_value_mapping(True)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "date": True
    >>> field.get_value_mapping(False)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "date": False
    >>> field.get_value_mapping(DATE)
    {u'test': datetime.date(2015, 5, 22)}
    >>> field.get_value_mapping(TIME)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "date": datetime.time(12, 34, 56)
    >>> field.get_value_mapping(DATETIME)
    {u'test': datetime.date(2015, 5, 22)}

    >>> DATE_MERGE_VECTORS = (
    ...     ({'base': 'date'}, '2015-05-22', '2015-05-22'),
    ... )
    >>> run_merge_tests({'base': 'date'}, DATE_MERGE_VECTORS)


TimeField
=========

::

    >>> field = TimeField('test')
    >>> pprint(field.get_deploy_facts('some_table'))
    [{'column': u'test', 'of': 'some_table', 'required': False, 'type': 'time'}]

    >>> field.get_value_mapping(None)
    {u'test': None}
    >>> field.get_value_mapping('foo')
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "time": 'foo'
    >>> field.get_value_mapping('foo')
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "time": u'foo'
    >>> field.get_value_mapping(1)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "time": 1
    >>> field.get_value_mapping(1.23)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "time": 1.23
    >>> field.get_value_mapping(Decimal('1.23'))
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "time": Decimal('1.23')
    >>> field.get_value_mapping(True)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "time": True
    >>> field.get_value_mapping(False)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "time": False
    >>> field.get_value_mapping(DATE)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "time": datetime.date(2015, 5, 22)
    >>> field.get_value_mapping(TIME)
    {u'test': datetime.time(12, 34, 56)}
    >>> field.get_value_mapping(DATETIME)
    {u'test': datetime.time(12, 34, 56)}

    >>> TIME_MERGE_VECTORS = (
    ...     ({'base': 'time'}, '12:34:56', '12:34:56'),
    ... )
    >>> run_merge_tests({'base': 'time'}, TIME_MERGE_VECTORS)


DateTimeField
=============

::

    >>> field = DateTimeField('test')
    >>> pprint(field.get_deploy_facts('some_table'))
    [{'column': u'test',
      'of': 'some_table',
      'required': False,
      'type': 'datetime'}]

    >>> field.get_value_mapping(None)
    {u'test': None}
    >>> field.get_value_mapping('foo')
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "dateTime": 'foo'
    >>> field.get_value_mapping('foo')
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "dateTime": u'foo'
    >>> field.get_value_mapping(1)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "dateTime": 1
    >>> field.get_value_mapping(1.23)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "dateTime": 1.23
    >>> field.get_value_mapping(Decimal('1.23'))
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "dateTime": Decimal('1.23')
    >>> field.get_value_mapping(True)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "dateTime": True
    >>> field.get_value_mapping(False)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "dateTime": False
    >>> field.get_value_mapping(DATE)
    {u'test': datetime.datetime(2015, 5, 22, 0, 0)}
    >>> field.get_value_mapping(TIME)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "dateTime": datetime.time(12, 34, 56)
    >>> field.get_value_mapping(DATETIME)
    {u'test': datetime.datetime(2015, 5, 22, 12, 34, 56)}

    >>> DATETIME_MERGE_VECTORS = (
    ...     ({'base': 'date'}, '2015-05-22', '2015-05-22T00:00:00'),
    ...     ({'base': 'dateTime'}, '2015-05-22T12:34:56', '2015-05-22T12:34:56'),
    ... )
    >>> run_merge_tests({'base': 'dateTime'}, DATETIME_MERGE_VECTORS)


EnumerationField
================

::

    >>> field = EnumerationField('test', enumerations=['foo','bar','baz-baz'])
    >>> pprint(field.get_deploy_facts('some_table'))
    [{'column': u'test',
      'of': 'some_table',
      'required': False,
      'type': ['foo', 'bar', 'baz-baz']}]

    >>> field.get_value_mapping(None)
    {u'test': None}
    >>> field.get_value_mapping('foo')
    {u'test': u'foo'}
    >>> field.get_value_mapping('foo')
    {u'test': u'foo'}
    >>> field.get_value_mapping('blah')
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumeration(foo,bar,baz-baz): 'blah'
    >>> field.get_value_mapping(1)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumeration(foo,bar,baz-baz): 1
    >>> field.get_value_mapping(1.23)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumeration(foo,bar,baz-baz): 1.23
    >>> field.get_value_mapping(Decimal('1.23'))
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumeration(foo,bar,baz-baz): Decimal('1.23')
    >>> field.get_value_mapping(True)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumeration(foo,bar,baz-baz): True
    >>> field.get_value_mapping(False)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumeration(foo,bar,baz-baz): False
    >>> field.get_value_mapping(DATE)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumeration(foo,bar,baz-baz): datetime.date(2015, 5, 22)
    >>> field.get_value_mapping(TIME)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumeration(foo,bar,baz-baz): datetime.time(12, 34, 56)
    >>> field.get_value_mapping(DATETIME)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumeration(foo,bar,baz-baz): datetime.datetime(2015, 5, 22, 12, 34, 56)

    >>> ENUM_MERGE_VECTORS = (
    ...     ({'base': 'enumeration', 'enumerations': {'foo':{},'bar':{}}}, 'bar', 'bar'),
    ... )
    >>> run_merge_tests({'base': 'enumeration', 'enumerations': {'foo':{},'baz':{}}}, ENUM_MERGE_VECTORS)


EnumerationSetField
===================

::

    >>> field = EnumerationSetField('test', enumerations=['foo','bar','baz-baz'])
    >>> pprint(field.get_deploy_facts('some_table'))
    [{'column': u'test_foo',
      'default': False,
      'of': 'some_table',
      'required': False,
      'type': 'boolean'},
     {'column': u'test_bar',
      'default': False,
      'of': 'some_table',
      'required': False,
      'type': 'boolean'},
     {'column': u'test_baz_baz',
      'default': False,
      'of': 'some_table',
      'required': False,
      'type': 'boolean'}]

    >>> field.get_value_mapping(None)
    {}
    >>> field.get_value_mapping('foo')
    {u'test_foo': True}
    >>> field.get_value_mapping('foo')
    {u'test_foo': True}
    >>> field.get_value_mapping('blah')
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumerationSet(foo,bar,baz-baz): 'blah'
    >>> field.get_value_mapping(1)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumerationSet(foo,bar,baz-baz): 1
    >>> field.get_value_mapping(1.23)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumerationSet(foo,bar,baz-baz): 1.23
    >>> field.get_value_mapping(Decimal('1.23'))
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumerationSet(foo,bar,baz-baz): Decimal('1.23')
    >>> field.get_value_mapping(True)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumerationSet(foo,bar,baz-baz): True
    >>> field.get_value_mapping(False)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumerationSet(foo,bar,baz-baz): False
    >>> field.get_value_mapping(DATE)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumerationSet(foo,bar,baz-baz): datetime.date(2015, 5, 22)
    >>> field.get_value_mapping(TIME)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumerationSet(foo,bar,baz-baz): datetime.time(12, 34, 56)
    >>> field.get_value_mapping(DATETIME)
    Traceback (most recent call last):
        ...
    Error: Cannot cast value to type "enumerationSet(foo,bar,baz-baz): datetime.datetime(2015, 5, 22, 12, 34, 56)
    >>> field.get_value_mapping(['foo'])
    {u'test_foo': True}
    >>> field.get_value_mapping(['foo', 'baz-baz'])
    {u'test_baz_baz': True, u'test_foo': True}
    >>> field.get_value_mapping(('foo', 'bar'))
    {u'test_foo': True, u'test_bar': True}

    >>> ENUMSET_MERGE_VECTORS = (
    ...     ({'base': 'enumerationSet', 'enumerations': {'foo':{},'blah':{}}}, ['blah'], ['blah']),
    ...     ({'base': 'enumeration', 'enumerations': {'foo':{},'bar':{}}}, 'bar', ['bar']),
    ... )
    >>> run_merge_tests({'base': 'enumerationSet', 'enumerations': {'foo':{},'baz':{}}}, ENUMSET_MERGE_VECTORS)


JsonField
=========

::

    >>> field = JsonField('test')

    >>> field.get_value_mapping(None)
    {u'test': 'null'}
    >>> field.get_value_mapping('foo')
    {u'test': '"foo"'}
    >>> field.get_value_mapping('foo')
    {u'test': '"foo"'}
    >>> field.get_value_mapping(1)
    {u'test': '1'}
    >>> field.get_value_mapping(1.23)
    {u'test': '1.23'}
    >>> field.get_value_mapping(Decimal('1.23'))
    {u'test': '1.23'}
    >>> field.get_value_mapping(True)
    {u'test': 'true'}
    >>> field.get_value_mapping(False)
    {u'test': 'false'}
    >>> field.get_value_mapping(DATE)
    {u'test': '"2015-05-22"'}
    >>> field.get_value_mapping(TIME)
    {u'test': '"12:34:56"'}
    >>> field.get_value_mapping(DATETIME)
    {u'test': '"2015-05-22T12:34:56.000Z"'}


Errors
======

Can't make fields of unknown types::

    >>> make_field({'id': 'test', 'type': {'base': 'imaginary'}})
    Traceback (most recent call last):
        ...
    Error: Cannot map fields of type "imaginary"

Attempting to merge incompatible types::

    >>> field = make_field({'id': 'test', 'type': {'base': 'date'}})
    >>> table = {'test': field}
    >>> field2 = make_field({'id': 'test', 'type': {'base': 'enumerationSet', 'enumerations': {'foo':{},'bar':{}}}})
    >>> merge_field_into(table, field2)
    Traceback (most recent call last):
        ...
    Error: Cannot merge fields of types date and enumerationSet (test)

Map an Assessment value from an unexpected InstrumentVersion::

    >>> field = make_field({'id': 'test', 'type': {'base': 'text'}}, instrument_version='1')
    >>> table = {'test': field}
    >>> field2 = make_field({'id': 'test', 'type': {'base': 'integer'}}, instrument_version='2')
    >>> merge_field_into(table, field2)
    >>> table['test'].map_assessment_value({'value': 'blah'}, instrument_version='nope')
    Traceback (most recent call last):
        ...
    Error: Unknown InstrumentVersion encountered




    >>> rex.off()


