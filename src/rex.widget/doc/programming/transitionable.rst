Transitionables
===============

Transitionables are a serialization mechanism used to transfer rich data from Python
to JavaScript with no loss of type information.

That makes it possible to transfer values like dates, datetimes, and
user defined types to the browser and have it recover those values into a useful
representation.

A lot of data types in `rex.widget` package are transitionable. These include
the `Widget` type itself and types like `Port`, `Query` and `URL`.

The main Python API for transitionables is the `rex.widget.encode` function which
takes an object to serialize and a WSGI request to use as a context::

    >>> from webob import Request
    >>> from rex.widget import encode

    >>> encode({'port': '/path'}, Request.blank('/'))
    u'["^ ","port","/path"]'

Its browser runtime counterpart is the `Transitionable.decode` function which
deserializes a blob to a JavaScript representation::

    > RexWidget.Transitionable.decode('["^ ","port","/path"]')
    {port: '/path'}

All data types which are handled by `json.dumps` can be also encoded/decoded
but in addition such types as `datetime.datetime` or `uuid.UUID` can be
handled as well::

    >>> from uuid import UUID

    >>> encode(UUID('7ab6a732-6c81-448d-afe3-82f59aaf88e3'), Request.blank('/'))
    u'["~#\'","~u7ab6a732-6c81-448d-afe3-82f59aaf88e3"]'

    > RexWidget.Transitionable.decode('["~#\'","~u7ab6a732-6c81-448d-afe3-82f59aaf88e3"]')
    UUID('7ab6a732-6c81-448d-afe3-82f59aaf88e3')

Defining new transitionable types
---------------------------------

The most common way to define a new transitionable type is to subclass
`Transitionable`::

    >>> from rex.widget import Transitionable

We need to define the `__transit_format__` method which will return a serialized
representation of an object::

    >>> class Port(Transitionable):
    ...
    ...     def __init__(self, route):
    ...         self.route = route
    ...
    ...     def __transit_format__(self, req, path):
    ...         return self.route

We can encode `Port` objects as usual with the `encode` function::

    >>> encode(Port('/port'), Request.blank('/'))
    u'["~#__main__.Port","/port"]'

By default the full name of the class is used as a tag for this specific type
representation.

Now we need to define how to recover port objects in the browser. 
First, suppose we
have some representation for a port object which allows us to call 
ports via XHR::

    > var Port = require('rex-widget/lib/Port');

We define a routine which deserialize objects tagged with `port` into those
`Port` JavaScript objects::

    > var {register} = require('rex-widget/lib/Transitionable');

    > register('__main__.Port', payload => new Port(payload));

Now a call to `decode` gives us back those objects::

    > decode('["~#port","/port"]')
    Port {route: '/port'}

Transitionable records
----------------------

There's a shortcut method to define a new record (a subclass of
`rex.core.Record`) and make it transitionable::

    >>> from rex.widget import TransitionableRecord

Now when you subclass `TransitionableRecord` and supply it the `fields` class
attribute you get a new transitionable record type::

    >>> class Column(TransitionableRecord):
    ... 
    ...     fields = ('key', 'label')

We can `encode` values of `Column` type::

    >>> encode(Column(key='name', label='Name'), Request.blank('/'))
    u'["~#__main__.Column",["name","Name"]]'

Making existing types transitionable
------------------------------------

Sometimes it is useful to make an existing type transitionable. We can use
the `as_transitionable` decorator for that::

    >>> from rex.widget import as_transitionable

Suppose we don't have `Port` defined as transitionable::

    >>> class Port(object):
    ...
    ...     def __init__(self, route):
    ...         self.route = route

Now we need to provide a tag and a representation for the `Port` type with the
help of the `as_transitionable` decorator::

    >>> @as_transitionable(Port)
    ... def _format_Port(value, req, path):
    ...     return value.route

Now we can encode `Port` just as if it was defined transitionable from the
start::

    >>> encode(Port('/port'), Request.blank('/'))
    u'["~#__main__.Port","/port"]'

