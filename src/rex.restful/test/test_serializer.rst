***********
Serializers
***********

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.restful.serializer import *
    >>> import datetime, decimal
    >>> from rex.core import Rex
    >>> rex = Rex('rex.restful')
    >>> rex.on()


Serializer
==========

The base class has methods to return lookup-dicts for the available
serializers::

    >>> Serializer.mapped()
    {'application/x-yaml': rex.restful.serializer.YamlSerializer, 'application/json': rex.restful.serializer.JsonSerializer}

    >>> Serializer.mapped_format()
    {'yaml': rex.restful.serializer.YamlSerializer, 'json': rex.restful.serializer.JsonSerializer}


The base class has methods to retrieve serializers for specified formats or
mime types::

    >>> Serializer.get_for_mime_type('application/json')
    rex.restful.serializer.JsonSerializer

    >>> Serializer.get_for_format('yaml')
    rex.restful.serializer.YamlSerializer


JsonSerializer
==============

This serializer will encode structures into their JSON equivalents::

    >>> serializer = JsonSerializer()

    >>> serializer.serialize({'foo': 'a'})
    '{"foo": "a"}'

    >>> serializer.serialize([{'foo': 'a'}, {'foo': 'b'}])
    '[{"foo": "a"}, {"foo": "b"}]'

    >>> serializer.serialize({'foo': 'a', 'bar': 'b'})
    '{"foo": "a", "bar": "b"}'

    >>> serializer.serialize({'foo': ['a', 'c'], 'bar': 'b'})
    '{"foo": ["a", "c"], "bar": "b"}'

    >>> serializer.serialize({'foo': ['a', 'c'], 'bar': 'b', 'baz': {'happy': 'a'}})
    '{"baz": {"happy": "a"}, "foo": ["a", "c"], "bar": "b"}'

    >>> serializer.serialize({'foo': ['a', 'c'], 'bar': 'b', 'baz': {'happy': 'a', 'sad': 'b'}})
    '{"baz": {"sad": "b", "happy": "a"}, "foo": ["a", "c"], "bar": "b"}'

    >>> serializer.serialize({'foo': ['a', 'c'], 'bar': 'b', 'baz': {'happy': ['a', 'c'], 'sad': 'b'}})
    '{"baz": {"sad": "b", "happy": ["a", "c"]}, "foo": ["a", "c"], "bar": "b"}'

    >>> serializer.serialize({'foo': {'bar': 'a', 'baz': {'happy': 'c'}}})
    '{"foo": {"baz": {"happy": "c"}, "bar": "a"}}'

    >>> serializer.serialize({'foo': {'bar': 'a', 'baz': {'happy': 'c', 'sad': 'd'}}})
    '{"foo": {"baz": {"sad": "d", "happy": "c"}, "bar": "a"}}'

    >>> serializer.serialize({'foo': {'bar': 'a', 'baz': {'happy': ['c', 'e'], 'sad': 'd'}}})
    '{"foo": {"baz": {"sad": "d", "happy": ["c", "e"]}, "bar": "a"}}'

    >>> serializer.serialize({'a_date': datetime.date(2014, 5, 22)})
    '{"a_date": "2014-05-22"}'

    >>> serializer.serialize({'a_time': datetime.time(12, 34, 56)})
    '{"a_time": "12:34:56"}'

    >>> serializer.serialize({'a_date': datetime.datetime(2014, 5, 22, 12, 34, 56)})
    '{"a_date": "2014-05-22T12:34:56.000Z"}'

    >>> serializer.serialize({'a_decimal': decimal.Decimal('1.23')})
    '{"a_decimal": 1.23}'


Given JSON objects or arrays, this serializer will decode them into their
Python equivalents (dicts & lists)::

    >>> serializer.deserialize('{"foo": "a"}')
    {u'foo': u'a'}

    >>> serializer.deserialize('[{"foo": "a"}, {"foo": "b"}]')
    [{u'foo': u'a'}, {u'foo': u'b'}]

    >>> serializer.deserialize('{"foo": "a", "bar": "b"}')
    {u'foo': u'a', u'bar': u'b'}

    >>> serializer.deserialize('{"foo": ["a", "c"], "bar": "b"}')
    {u'foo': [u'a', u'c'], u'bar': u'b'}

    >>> serializer.deserialize('{"baz": {"happy": "a"}, "foo": ["a", "c"], "bar": "b"}')
    {u'baz': {u'happy': u'a'}, u'foo': [u'a', u'c'], u'bar': u'b'}

    >>> serializer.deserialize('{"baz": {"sad": "b", "happy": "a"}, "foo": ["a", "c"], "bar": "b"}')
    {u'baz': {u'happy': u'a', u'sad': u'b'}, u'foo': [u'a', u'c'], u'bar': u'b'}

    >>> serializer.deserialize('{"baz": {"sad": "b", "happy": ["a", "c"]}, "foo": ["a", "c"], "bar": "b"}')
    {u'baz': {u'happy': [u'a', u'c'], u'sad': u'b'}, u'foo': [u'a', u'c'], u'bar': u'b'}

    >>> serializer.deserialize('{"foo": {"baz": {"happy": "c"}, "bar": "a"}}')
    {u'foo': {u'bar': u'a', u'baz': {u'happy': u'c'}}}

    >>> serializer.deserialize('{"foo": {"baz": {"sad": "d", "happy": "c"}, "bar": "a"}}')
    {u'foo': {u'bar': u'a', u'baz': {u'sad': u'd', u'happy': u'c'}}}

    >>> serializer.deserialize('{"foo": {"baz": {"sad": "d", "happy": ["c", "e"]}, "bar": "a"}}')
    {u'foo': {u'bar': u'a', u'baz': {u'sad': u'd', u'happy': [u'c', u'e']}}}

    >>> serializer.deserialize('{"a_date": "2014-05-22"}')
    {u'a_date': datetime.date(2014, 5, 22)}

    >>> serializer.deserialize('{"a_time": "12:34:56"}')
    {u'a_time': datetime.time(12, 34, 56)}

    >>> serializer.deserialize('{"a_date": "2014-05-22T12:34:56.000Z"}')
    {u'a_date': datetime.datetime(2014, 5, 22, 12, 34, 56)}


If initialized with ``deserialize_datetimes=False``, then this deserializer
will return date/time fields as the original strings they were received as::

    >>> serializer = JsonSerializer(deserialize_datetimes=False)

    >>> serializer.deserialize('{"a_date": "2014-05-22"}')
    {u'a_date': u'2014-05-22'}

    >>> serializer.deserialize('{"a_time": "12:34:56"}')
    {u'a_time': u'12:34:56'}

    >>> serializer.deserialize('{"a_date": "2014-05-22T12:34:56.000Z"}')
    {u'a_date': u'2014-05-22T12:34:56.000Z'}


YamlSerializer
==============

This serializer will encode structures into their YAML equivalents::

    >>> serializer = YamlSerializer()

    >>> serializer.serialize({'foo': 'a'})
    '{foo: a}\n'

    >>> serializer.serialize([{'foo': 'a'}, {'foo': 'b'}])
    '- {foo: a}\n- {foo: b}\n'

    >>> serializer.serialize({'foo': 'a', 'bar': 'b'})
    '{bar: b, foo: a}\n'

    >>> serializer.serialize({'foo': ['a', 'c'], 'bar': 'b'})
    'bar: b\nfoo: [a, c]\n'

    >>> serializer.serialize({'foo': ['a', 'c'], 'bar': 'b', 'baz': {'happy': 'a'}})
    'bar: b\nbaz: {happy: a}\nfoo: [a, c]\n'

    >>> serializer.serialize({'foo': ['a', 'c'], 'bar': 'b', 'baz': {'happy': 'a', 'sad': 'b'}})
    'bar: b\nbaz: {happy: a, sad: b}\nfoo: [a, c]\n'

    >>> serializer.serialize({'foo': ['a', 'c'], 'bar': 'b', 'baz': {'happy': ['a', 'c'], 'sad': 'b'}})
    'bar: b\nbaz:\n  happy: [a, c]\n  sad: b\nfoo: [a, c]\n'

    >>> serializer.serialize({'foo': {'bar': 'a', 'baz': {'happy': 'c'}}})
    'foo:\n  bar: a\n  baz: {happy: c}\n'

    >>> serializer.serialize({'foo': {'bar': 'a', 'baz': {'happy': 'c', 'sad': 'd'}}})
    'foo:\n  bar: a\n  baz: {happy: c, sad: d}\n'

    >>> serializer.serialize({'foo': {'bar': 'a', 'baz': {'happy': ['c', 'e'], 'sad': 'd'}}})
    'foo:\n  bar: a\n  baz:\n    happy: [c, e]\n    sad: d\n'

    >>> serializer.serialize({'a_date': datetime.date(2014, 5, 22)})
    '{a_date: 2014-05-22}\n'

    >>> serializer.serialize({'a_time': datetime.time(12, 34, 56)})
    "{a_time: '12:34:56'}\n"

    >>> serializer.serialize({'a_date': datetime.datetime(2014, 5, 22, 12, 34, 56)})
    "{a_date: !!timestamp '2014-05-22 12:34:56'}\n"

    >>> serializer.serialize({'a_decimal': decimal.Decimal('1.23')})
    '{a_decimal: 1.23}\n'


Given YAML maps or arrays, this serializer will decode them into their
Python equivalents (dicts & lists)::

    >>> serializer.deserialize('{foo: a}\n')
    {'foo': 'a'}

    >>> serializer.deserialize('- {foo: a}\n- {foo: b}\n')
    [{'foo': 'a'}, {'foo': 'b'}]

    >>> serializer.deserialize('{bar: b, foo: a}\n')
    {'foo': 'a', 'bar': 'b'}

    >>> serializer.deserialize('bar: b\nfoo: [a, c]\n')
    {'foo': ['a', 'c'], 'bar': 'b'}

    >>> serializer.deserialize('bar: b\nbaz: {happy: a}\nfoo: [a, c]\n')
    {'bar': 'b', 'foo': ['a', 'c'], 'baz': {'happy': 'a'}}

    >>> serializer.deserialize('bar: b\nbaz: {happy: a, sad: b}\nfoo: [a, c]\n')
    {'bar': 'b', 'foo': ['a', 'c'], 'baz': {'happy': 'a', 'sad': 'b'}}

    >>> serializer.deserialize('bar: b\nbaz:\n  happy: [a, c]\n  sad: b\nfoo: [a, c]\n')
    {'bar': 'b', 'foo': ['a', 'c'], 'baz': {'happy': ['a', 'c'], 'sad': 'b'}}

    >>> serializer.deserialize('foo:\n  bar: a\n  baz: {happy: c}\n')
    {'foo': {'bar': 'a', 'baz': {'happy': 'c'}}}

    >>> serializer.deserialize('foo:\n  bar: a\n  baz: {happy: c, sad: d}\n')
    {'foo': {'bar': 'a', 'baz': {'happy': 'c', 'sad': 'd'}}}

    >>> serializer.deserialize('foo:\n  bar: a\n  baz:\n    happy: [c, e]\n    sad: d\n')
    {'foo': {'bar': 'a', 'baz': {'happy': ['c', 'e'], 'sad': 'd'}}}

    >>> serializer.deserialize('{a_date: 2014-05-22}\n')
    {'a_date': datetime.date(2014, 5, 22)}

    >>> #serializer.deserialize("{a_time: '12:34:56'}\n")
    {'a_time': datetime.time(12, 34, 56)}

    >>> serializer.deserialize("{a_date: !!timestamp '2014-05-22 12:34:56'}\n")
    {'a_date': datetime.datetime(2014, 5, 22, 12, 34, 56)}


If initialized with ``deserialize_datetimes=False``, then this deserializer
will return date/time fields as the original strings they were received as::

    >>> serializer = YamlSerializer(deserialize_datetimes=False)

    >>> serializer.deserialize('{a_date: 2014-05-22}\n')
    {'a_date': u'2014-05-22'}

    >>> serializer.deserialize("{a_time: '12:34:56'}\n")
    {'a_time': '12:34:56'}

    >>> serializer.deserialize("{a_date: !!timestamp '2014-05-22 12:34:56'}\n")
    {'a_date': u'2014-05-22 12:34:56'}

