Define simple widget
====================

Required imports and preparings::

    >>> from rex.core import Rex

    >>> demo = Rex('-')
    >>> demo.on()

    >>> from rex.core import IntVal, StrVal
    >>> from rex.widget import Widget, Field

Now we can define a widget with two fields::

    >>> class MyHeader(Widget):
    ...   name = 'MyHeader'
    ...   js_type = 'should-be-ok-for-test'
    ...
    ...   text  = Field(StrVal)
    ...   level = Field(IntVal, default=1)

Check if widget is defined::

    >>> MyHeader in Widget.all()
    True

    >>> 'MyHeader' in Widget.map_all()
    True

Now it can be parsed out of its YAML representation:: 

    >>> w = Widget.parse("""
    ... !<MyHeader>
    ... text: 'Hello, world!'
    ... """)

    >>> isinstance(w, MyHeader)
    True

    >>> w.text
    'Hello, world!'

    >>> w.level
    1

    >>> w.values
    {'text': 'Hello, world!', 'level': 1}

We can specify ``level`` field and override its default value::

    >>> w = Widget.parse("""
    ... !<MyHeader>
    ... text: 'Hello, world!'
    ... level: 2
    ... """)

    >>> isinstance(w, MyHeader)
    True

    >>> w.text
    'Hello, world!'

    >>> w.level
    2

    >>> w.values
    {'text': 'Hello, world!', 'level': 2}

Alternatively we can use shortcut for YAML representation which allows only
specify the first field::

    >>> w = Widget.parse("""
    ... !<MyHeader> "Hello, world!"
    ... """)

    >>> isinstance(w, MyHeader)
    True

    >>> w.text
    'Hello, world!'

    >>> w.level
    1

    >>> w.values
    {'text': 'Hello, world!', 'level': 1}
