Define simple widget
====================

First of all we need to initialize a new Rex application::

    >>> from rex.core import Rex

    >>> demo = Rex('-')
    >>> demo.on()

Now to define our first widget we need to import the ``Widget`` and ``Field``
classes from the ``rex.widget`` package::

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

The constructed widget should have the correct type::

    >>> isinstance(widget, MyHeader)
    True

We can access field values through properties::

    >>> widget.text
    'Hello, world!'

    >>> widget.level
    1

Or we can get all widget values via the ``values`` attribute::

    >>> widget.values
    {'text': 'Hello, world!', 'level': 1}

Overriding default field values
-------------------------------

We can specify the ``level`` field and override its default value::

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

Alternatively, for widgets which only have one required field, we can use 
a shortcut representation::

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

