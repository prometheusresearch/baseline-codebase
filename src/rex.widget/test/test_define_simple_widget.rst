Define simple widget
====================

First of all we need to initialize new Rex application::

    >>> from rex.core import Rex

    >>> demo = Rex('-')
    >>> demo.on()

Now to define our first widget we need to import ``Widget`` and ``Field``
classes from ``rex.widget`` package::

    >>> from rex.core import IntVal, StrVal
    >>> from rex.widget import Widget, Field

Now we define a simple widget with two fields::

    >>> class MyHeader(Widget):
    ...
    ...   name = 'MyHeader'
    ...   js_type = 'should-be-ok-for-test'
    ...
    ...   text = Field(
    ...       StrVal(),
    ...       doc='Header text')
    ...
    ...   level = Field(
    ...       IntVal(), default=1,
    ...       doc='Header level')

``Widget`` class keeps track of each defined widget::

    >>> MyHeader in Widget.all()
    True

    >>> 'MyHeader' in Widget.map_all()
    True

Constructing widget instances
-----------------------------

TBD

Parsing widget instances from YAML
----------------------------------

We can get a factory for our widget out of its YAML representation::

    >>> from rex.widget import parse

    >>> widget = parse("""
    ... !<MyHeader>
    ... text: 'Hello, world!'
    ... """)

Constructed widget should have correct type::

    >>> isinstance(widget, MyHeader)
    True

We can access field values through properties::

    >>> widget.text
    'Hello, world!'

    >>> widget.level
    1

Or we can get all widget values via ``values`` attribute::

    >>> widget.values
    {'text': 'Hello, world!', 'level': 1}

Overriding default field values
-------------------------------

We can specify ``level`` field and override its default value::

    >>> widget = parse("""
    ... !<MyHeader>
    ... text: 'Hello, world!'
    ... level: 2
    ... """)

    >>> widget.level
    2

    >>> widget.values
    {'text': 'Hello, world!', 'level': 2}

Shortcut YAML representation
----------------------------

Alternatively we can use shortcut for YAML representation which allows only
specify the first field::

    >>> widget = parse("""
    ... !<MyHeader> "Hello, world!"
    ... """)

    >>> isinstance(widget, MyHeader)
    True

    >>> widget.text
    'Hello, world!'

    >>> widget.level
    1

    >>> widget.values
    {'text': 'Hello, world!', 'level': 1}
