Test parsing widget descriptions from YAML representation
=========================================================

Initialize the Rex application::

    >>> import rex.ctl

    >>> from rex.core import Rex
    >>> app = Rex('-')
    >>> app.on()

Widgets can be instantiated through the YAML configuration. The first step is 
to parse the YAML into a sensible object model which can be processed later.

Parsing
-------

The ``parse`` function is used to convert the YAML representation of a widget 
into an object model::

    >>> from rex.widget.parse import parse

It performs no validations but just provides us with a "syntactically valid"
object model::

    >>> parse("""
    ... !<Person>
    ... first_name: John
    ... last_name: Doe
    ... """)
    WidgetDesc(name=u'Person', fields=OrderedDict([('first_name', 'John'), ('last_name', 'Doe')]))

It also can parse a shorthand widget notation::

    >>> parse("""
    ... !<Person> John Doe
    ... """)
    WidgetDesc(name=u'Person', fields=OrderedDict([(None, 'John Doe')]))

When parsing a shorthand widget notation which is followed by a sequence, the
sequence becomes the only field of the ``WidgetDesc`` object::

    >>> parse("""
    ... !<Person>
    ... - 1
    ... - 2
    ... - 3
    ... """)
    WidgetDesc(name=u'Person', fields=OrderedDict([(None, [1, 2, 3])]))

The plain data is parsed as-is::

    >>> parse("""
    ... - 1
    ... - 2
    ... - 3
    ... """)
    [1, 2, 3]

    >>> list(sorted(parse("""
    ... a: 1
    ... b: 2
    ... """).items()))
    [('a', 1), ('b', 2)]

    >>> parse("""
    ... hello
    ... """)
    'hello'

How ``null`` is parsed::

    >>> parse("""
    ... null
    ... """)
    None

Parsing slots
-------------

By default slot parsing is not enabled::

    >>> parse("""
    ... a: !slot a
    ... """) # doctest: +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
    ...
    Error: Slots are not allowed in this context

But can be enabled via ``allow_slots=True``::

    >>> parse("""
    ... a: !slot a
    ... """, allow_slots=True) # doctest: +NORMALIZE_WHITESPACE
    {'a': Slot(name=u'a', default=NotImplemented)}
    
Slots with default values can be specified::

    >>> parse("""
    ... a: !slot
    ...   name: a
    ...   default: 42
    ... """, allow_slots=True) # doctest: +NORMALIZE_WHITESPACE
    {'a': Slot(name='a', default=42)}

Parsing ``undefined``
---------------------

::

    >>> parse("""
    ... !undefined
    ... """)
    Undefined()

    >>> parse("""
    ... a: !undefined
    ... """)
    {'a': Undefined()}
      

Attached location
-----------------

A parsed object model has a location attached to it which can be queries via
the ``locate`` function of the :mod:`rex.widget.location.locate` module::

    >>> from rex.widget.location import locate

This helps in producing sensible error messages at later stages of processing::

    >>> desc = parse("""
    ... !<Person>
    ... first_name: John
    ... last_name: Doe
    ... """)
    >>> locate(desc)
    Location('<byte string>', 1)
    >>> locate(desc.fields['first_name'])
    Location('<byte string>', 2)
    >>> locate(desc.fields['last_name'])
    Location('<byte string>', 3)

Not only ``WidgetDesc`` objects and their fields are annotated but also plain
data::

    >>> data = parse("""
    ... hello
    ... """)
    >>> locate(data)
    Location('<byte string>', 1)

    >>> data = parse("""
    ... a: b
    ... c:
    ...   d: e
    ... """)
    >>> locate(data)
    Location('<byte string>', 1)
    >>> locate(data['a'])
    Location('<byte string>', 1)
    >>> locate(data['c'])
    Location('<byte string>', 3)
    >>> locate(data['c']['d'])
    Location('<byte string>', 3)

Cleanup
-------

Shutdown the Rex application::

    >>> app.off()
