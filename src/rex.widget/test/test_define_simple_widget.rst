::

    >>> from rex.core import Rex

    >>> demo = Rex('-')
    >>> demo.on()

    >>> from rex.core import IntVal, StrVal
    >>> from rex.widget import Widget

    >>> class MyHeader(Widget):
    ...   name = 'MyHeader'
    ...   js_type = 'should-be-ok-for-test'
    ...   fields = [
    ...       ('text', StrVal),
    ...       ('level', IntVal, 1),
    ...   ]

    >>> MyHeader in Widget.all()
    True

    >>> 'MyHeader' in Widget.map_all()
    True

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

    >>> w.descriptor() # doctest: +NORMALIZE_WHITESPACE
    WidgetDescriptor(widget={'__type__': 'should-be-ok-for-test', 'props': {'text': 'Hello, world!', 'level': 1}},
                     state=StateGraph(storage={}, dependents={}))
