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

We can get a factory for our widget out of its YAML representation::

    >>> w_factory = Widget.parse("""
    ... !<MyHeader>
    ... text: 'Hello, world!'
    ... """)

We need to pass ``context`` to factory to obtain a widget instance. For the test
purposes ``context`` can be ``None``::

    >>> w = w_factory(None)

Constructed widget should have correct type::

    >>> isinstance(w, MyHeader)
    True

We can access field values through properties::

    >>> w.text
    'Hello, world!'

    >>> w.level
    1

Or we can get all widget values via ``values`` attribute::

    >>> w.values
    {'text': 'Hello, world!', 'level': 1}

Overriding default field values
-------------------------------

We can specify ``level`` field and override its default value::

    >>> w = Widget.parse("""
    ... !<MyHeader>
    ... text: 'Hello, world!'
    ... level: 2
    ... """)

    >>> w = w(None)

    >>> w.level
    2

    >>> w.values
    {'text': 'Hello, world!', 'level': 2}

Shortcut YAML representation
----------------------------

Alternatively we can use shortcut for YAML representation which allows only
specify the first field::

    >>> w = Widget.parse("""
    ... !<MyHeader> "Hello, world!"
    ... """)

    >>> w = w(None)

    >>> isinstance(w, MyHeader)
    True

    >>> w.text
    'Hello, world!'

    >>> w.level
    1

    >>> w.values
    {'text': 'Hello, world!', 'level': 1}
