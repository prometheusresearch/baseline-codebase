***********
Serializers
***********

.. contents:: Table of Contents


Set up the environment::

    >>> from rex.restful.serializer import *
    >>> import datetime, decimal
    >>> from rex.core import Rex
    >>> from rex.db import get_db
    >>> rex = Rex('rex.restful_demo')
    >>> rex.on()


Serializer
==========

The base class has methods to return lookup-dicts for the available
serializers::

    >>> Serializer.mapped()
    {'application/json': rex.restful.serializer.JsonSerializer, 'application/x-yaml': rex.restful.serializer.YamlSerializer}

    >>> Serializer.mapped_format()
    {'json': rex.restful.serializer.JsonSerializer, 'yaml': rex.restful.serializer.YamlSerializer}


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
    '{"foo": ["a", "c"], "bar": "b", "baz": {"happy": "a"}}'

    >>> serializer.serialize({'foo': ['a', 'c'], 'bar': 'b', 'baz': {'happy': 'a', 'sad': 'b'}})
    '{"foo": ["a", "c"], "bar": "b", "baz": {"happy": "a", "sad": "b"}}'

    >>> serializer.serialize({'foo': ['a', 'c'], 'bar': 'b', 'baz': {'happy': ['a', 'c'], 'sad': 'b'}})
    '{"foo": ["a", "c"], "bar": "b", "baz": {"happy": ["a", "c"], "sad": "b"}}'

    >>> serializer.serialize({'foo': {'bar': 'a', 'baz': {'happy': 'c'}}})
    '{"foo": {"bar": "a", "baz": {"happy": "c"}}}'

    >>> serializer.serialize({'foo': {'bar': 'a', 'baz': {'happy': 'c', 'sad': 'd'}}})
    '{"foo": {"bar": "a", "baz": {"happy": "c", "sad": "d"}}}'

    >>> serializer.serialize({'foo': {'bar': 'a', 'baz': {'happy': ['c', 'e'], 'sad': 'd'}}})
    '{"foo": {"bar": "a", "baz": {"happy": ["c", "e"], "sad": "d"}}}'

    >>> serializer.serialize({'a_date': datetime.date(2014, 5, 22)})
    '{"a_date": "2014-05-22"}'

    >>> serializer.serialize({'a_time': datetime.time(12, 34, 56)})
    '{"a_time": "12:34:56"}'

    >>> serializer.serialize({'a_date': datetime.datetime(2014, 5, 22, 12, 34, 56)})
    '{"a_date": "2014-05-22T12:34:56.000Z"}'

    >>> serializer.serialize({'a_decimal': decimal.Decimal('1.23')})
    '{"a_decimal": 1.23}'

    >>> serializer.serialize({'a_set': set(["foo"])})
    '{"a_set": ["foo"]}'

    >>> serializer.serialize({'an_obj': object()})  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    TypeError: Object of type ... is not JSON serializable


Given JSON objects or arrays, this serializer will decode them into their
Python equivalents (dicts & lists)::

    >>> serializer.deserialize('{"foo": "a"}')
    {'foo': 'a'}

    >>> serializer.deserialize('[{"foo": "a"}, {"foo": "b"}]')
    [{'foo': 'a'}, {'foo': 'b'}]

    >>> serializer.deserialize('{"foo": "a", "bar": "b"}')
    {'foo': 'a', 'bar': 'b'}

    >>> serializer.deserialize('{"foo": ["a", "c"], "bar": "b"}')
    {'foo': ['a', 'c'], 'bar': 'b'}

    >>> serializer.deserialize('{"baz": {"happy": "a"}, "foo": ["a", "c"], "bar": "b"}')
    {'baz': {'happy': 'a'}, 'foo': ['a', 'c'], 'bar': 'b'}

    >>> serializer.deserialize('{"baz": {"sad": "b", "happy": "a"}, "foo": ["a", "c"], "bar": "b"}')
    {'baz': {'sad': 'b', 'happy': 'a'}, 'foo': ['a', 'c'], 'bar': 'b'}

    >>> serializer.deserialize('{"baz": {"sad": "b", "happy": ["a", "c"]}, "foo": ["a", "c"], "bar": "b"}')
    {'baz': {'sad': 'b', 'happy': ['a', 'c']}, 'foo': ['a', 'c'], 'bar': 'b'}

    >>> serializer.deserialize('{"foo": {"baz": {"happy": "c"}, "bar": "a"}}')
    {'foo': {'baz': {'happy': 'c'}, 'bar': 'a'}}

    >>> serializer.deserialize('{"foo": {"baz": {"sad": "d", "happy": "c"}, "bar": "a"}}')
    {'foo': {'baz': {'sad': 'd', 'happy': 'c'}, 'bar': 'a'}}

    >>> serializer.deserialize('{"foo": {"baz": {"sad": "d", "happy": ["c", "e"]}, "bar": "a"}}')
    {'foo': {'baz': {'sad': 'd', 'happy': ['c', 'e']}, 'bar': 'a'}}

    >>> serializer.deserialize('{"a_date": "2014-05-22"}')
    {'a_date': datetime.date(2014, 5, 22)}

    >>> serializer.deserialize('{"a_time": "12:34:56"}')
    {'a_time': datetime.time(12, 34, 56)}

    >>> serializer.deserialize('{"a_date": "2014-05-22T12:34:56.000Z"}')
    {'a_date': datetime.datetime(2014, 5, 22, 12, 34, 56)}


If initialized with ``deserialize_datetimes=False``, then this deserializer
will return date/time fields as the original strings they were received as::

    >>> serializer = JsonSerializer(deserialize_datetimes=False)

    >>> serializer.deserialize('{"a_date": "2014-05-22"}')
    {'a_date': '2014-05-22'}

    >>> serializer.deserialize('{"a_time": "12:34:56"}')
    {'a_time': '12:34:56'}

    >>> serializer.deserialize('{"a_date": "2014-05-22T12:34:56.000Z"}')
    {'a_date': '2014-05-22T12:34:56.000Z'}


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

    >>> serializer.serialize({'a_set': set(["foo"])})
    'a_set: [foo]\n'

    >>> serializer.serialize({'an_obj': object()})  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    yaml.representer.RepresenterError: cannot represent an object: <object object at 0x...>


Given YAML maps or arrays, this serializer will decode them into their
Python equivalents (dicts & lists)::

    >>> serializer.deserialize('{foo: a}\n')
    {'foo': 'a'}

    >>> serializer.deserialize('- {foo: a}\n- {foo: b}\n')
    [{'foo': 'a'}, {'foo': 'b'}]

    >>> serializer.deserialize('{bar: b, foo: a}\n')
    {'bar': 'b', 'foo': 'a'}

    >>> serializer.deserialize('bar: b\nfoo: [a, c]\n')
    {'bar': 'b', 'foo': ['a', 'c']}

    >>> serializer.deserialize('bar: b\nbaz: {happy: a}\nfoo: [a, c]\n')
    {'bar': 'b', 'baz': {'happy': 'a'}, 'foo': ['a', 'c']}

    >>> serializer.deserialize('bar: b\nbaz: {happy: a, sad: b}\nfoo: [a, c]\n')
    {'bar': 'b', 'baz': {'happy': 'a', 'sad': 'b'}, 'foo': ['a', 'c']}

    >>> serializer.deserialize('bar: b\nbaz:\n  happy: [a, c]\n  sad: b\nfoo: [a, c]\n')
    {'bar': 'b', 'baz': {'happy': ['a', 'c'], 'sad': 'b'}, 'foo': ['a', 'c']}

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
    {'a_date': '2014-05-22'}

    >>> serializer.deserialize("{a_time: '12:34:56'}\n")
    {'a_time': '12:34:56'}

    >>> serializer.deserialize("{a_date: !!timestamp '2014-05-22 12:34:56'}\n")
    {'a_date': '2014-05-22 12:34:56'}


marshall_htsql_result
======================

This function transforms HTSQL query results into structures that can be
automatically serialized by the built-in rex.restful Serializers::

    >>> from pprint import pprint
    >>> pprint(marshall_htsql_result(get_db().produce('/parent')))
    [{'code': 100,
      'col_bool': False,
      'col_float': 1.23,
      'col_json': None,
      'col_text': 'some text'},
     {'code': 200,
      'col_bool': True,
      'col_float': 4.2,
      'col_json': {'bar': 'happy', 'foo': 1},
      'col_text': 'blah blah'}]

    >>> pprint(marshall_htsql_result(get_db().produce('/parent[100]{code, col_text, /child}')[0]))
    {'child': [{'code': 1, 'col1': 'foo', 'col2': 42, 'parent': '100'},
               {'code': 2, 'col1': 'bar', 'col2': None, 'parent': '100'}],
     'code': 100,
     'col_text': 'some text'}

