Test widget templates
=====================

Initialize the Rex app::

    >>> import rex.ctl

    >>> from rex.core import Rex
    >>> app = Rex('-')
    >>> app.on()

First we need to define a few widgets which will be used in templates::

    >>> from rex.core import StrVal, IntVal, MapVal
    >>> from rex.widget.widget import Widget, GroupWidget
    >>> from rex.widget.field import Field

    >>> class Text(Widget):
    ...   name = 'Text'
    ...   js_type = 'Text'
    ...   content = Field(StrVal())

    >>> class Header(Widget):
    ...   name = 'Header'
    ...   js_type = 'Header'
    ...   content = Field(StrVal())
    ...   level = Field(IntVal())

    >>> class Label(Widget):
    ...   name = 'Label'
    ...   js_type = 'Label'
    ...   text = Field(StrVal())
    ...   size = Field(IntVal(), default=None)

    >>> class ComplexBase(Widget):
    ...   name = 'ComplexBase'
    ...   js_type = 'ComplexBase'
    ...
    ...   field = Field(MapVal(StrVal(), StrVal()))

 Now we can use ``parse_template`` function from::

    >>> from rex.widget import parse_template

    >>> parse_template("""
    ... widgets:
    ...   MyHeader: !<Header>
    ...     content: !slot text
    ...     level: 2
    ... """)

Widget is parsed and is registered::

    >>> 'MyHeader' in Widget.map_all()
    True
    >>> MyHeader = Widget.map_all()['MyHeader']
    >>> MyHeader.fields.keys()
    [u'text']

Now we can try to instantiate it from YAML::

    >>> from rex.widget.parse import parse as parse_widget
    >>> from rex.widget.validate import validate as validate_widget

    >>> def make_widget(stream):
    ...   return validate_widget(parse_widget(stream))

::

    >>> my_header = make_widget("""
    ... !<MyHeader>
    ... text: Hello
    ... """)

    >>> my_header
    MyHeader(text='Hello')


    >>> my_header.descriptor() # doctest: +NORMALIZE_WHITESPACE
    WidgetDescriptor(ui=UIDescriptor(type='Header',
        props=<PropsContainer {'content': 'Hello', 'level': 2}>,
        widget=Header(content='Hello', level=2)),
      state=StateGraph(storage={}, dependents={}))

It also validates everything up::

    >>> make_widget("""
    ... !<MyHeader>
    ... text: 1
    ... """) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Expected a string
    Got:
        1
    While parsing:
        "<byte string>", line 3
    While constructing widget
        <MyHeader>

::

    >>> parse_template("""
    ... widgets:
    ...   MyHeader: !<Unknown>
    ...     content: !slot text
    ...     level: 2
    ... """) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Unknown widget
        <Unknown>
    While parsing:
        "<byte string>", line 3
    While processing widget template:
        <MyHeader>

::

    >>> parse_template("""
    ... widgets:
    ...   MyHeader:
    ...     content: !slot text
    ...     level: 2
    ... """) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: template should define a widget
    Got:
        {'content': Slot(name=u'text', default=NotImplemented), 'level': 2}
    While parsing:
        "<byte string>", line 4
    While processing widget template:
        <MyHeader>


::

    >>> parse_template("""
    ... widgets:
    ...   A: !<Text>
    ...     content: Hello, A
    ...   B: !<A>
    ... """)

    >>> 'A' in Widget.map_all()
    True
    >>> 'B' in Widget.map_all()
    True


    >>> a = make_widget("""
    ... !<A>
    ... """)
    >>> a
    A()

    >>> a.descriptor() # doctest: +NORMALIZE_WHITESPACE
    WidgetDescriptor(ui=UIDescriptor(type='Text',
        props=<PropsContainer {'content': 'Hello, A'}>,
        widget=Text(content='Hello, A')),
      state=StateGraph(storage={}, dependents={}))

    >>> b = make_widget("""
    ... !<B>
    ... """)

    >>> b
    B()

    >>> b.descriptor() # doctest: +NORMALIZE_WHITESPACE
    WidgetDescriptor(ui=UIDescriptor(type='Text', props=<PropsContainer {'content': 'Hello, A'}>,
        widget=Text(content='Hello, A')),
      state=StateGraph(storage={}, dependents={}))

::

    >>> parse_template("""
    ... widgets:
    ...   D: !<C>
    ...   C: !<Text>
    ...     content: Hello, A
    ... """)

    >>> 'C' in Widget.map_all()
    True
    >>> 'D' in Widget.map_all()
    True


    >>> c = make_widget("""
    ... !<C>
    ... """)
    >>> c
    C()

    >>> c.descriptor() # doctest: +NORMALIZE_WHITESPACE
    WidgetDescriptor(ui=UIDescriptor(type='Text',
        props=<PropsContainer {'content': 'Hello, A'}>,
        widget=Text(content='Hello, A')),
      state=StateGraph(storage={}, dependents={}))

    >>> d = make_widget("""
    ... !<D>
    ... """)

    >>> d
    D()

    >>> d.descriptor() # doctest: +NORMALIZE_WHITESPACE
    WidgetDescriptor(ui=UIDescriptor(type='Text',
        props=<PropsContainer {'content': 'Hello, A'}>,
        widget=Text(content='Hello, A')),
      state=StateGraph(storage={}, dependents={}))

::

    >>> parse_template("""
    ... widgets:
    ...   Complex: !<ComplexBase>
    ...     field:
    ...       a: !slot a
    ...       b: !slot
    ...         name: b
    ...         default: B
    ... """)

    >>> 'Complex' in Widget.map_all()
    True

    >>> Complex = Widget.map_all()['Complex']
    >>> Complex.fields # doctest: +NORMALIZE_WHITESPACE
    OrderedDict([(u'a', Field(MaybeUndefinedVal(AnyVal()))),
                 ('b', Field(MaybeUndefinedVal(AnyVal()) default='B'))])


    >>> widget = make_widget("""
    ... !<Complex>
    ... a: "a"
    ... b: "b"
    ... """)
    >>> widget
    Complex(a='a', b='b')

    >>> widget.descriptor() # doctest: +NORMALIZE_WHITESPACE
    WidgetDescriptor(ui=UIDescriptor(type='ComplexBase',
                     props=<PropsContainer {'field': {'a': 'a', 'b': 'b'}}>,
                     widget=ComplexBase(field={'a': 'a', 'b': 'b'})), state=StateGraph(storage={}, dependents={}))

    >>> widget = make_widget("""
    ... !<Complex>
    ... a: "a"
    ... """)
    >>> widget
    Complex(a='a')

    >>> widget.descriptor() # doctest: +NORMALIZE_WHITESPACE
    WidgetDescriptor(ui=UIDescriptor(type='ComplexBase',
                     props=<PropsContainer {'field': {'a': 'a', 'b': 'B'}}>,
                     widget=ComplexBase(field={'a': 'a', 'b': 'B'})), state=StateGraph(storage={}, dependents={}))

    >>> widget = make_widget("""
    ... !<Complex>
    ... a: 1
    ... """) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Expected a string
    Got:
        1
    While validating mapping value for key:
        'a'
    While constructing widget
        <ComplexBase>
    While constructing widget:
        <Complex>
    While parsing:
        "<byte string>", line 2

::

    >>> app.off()
