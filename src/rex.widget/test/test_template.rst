Test widget templates
=====================

Initialize the Rex app::

    >>> import rex.ctl

    >>> from rex.core import Rex
    >>> app = Rex('-')
    >>> app.on()

First we need to define a few widgets which will be used in our templates::

    >>> from rex.core import StrVal, IntVal, MapVal
    >>> from rex.widget.widget import Widget, GroupWidget
    >>> from rex.widget.field import Field, CollectionField

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

    >>> class WidgetWithMapValBase(Widget):
    ...   name = 'WidgetWithMapValBase'
    ...   js_type = 'WidgetWithMapValBase'
    ...   field = Field(MapVal(StrVal(), StrVal()))

    >>> class WidgetWithCollectionFieldBase(Widget):
    ...   name = 'WidgetWithCollectionFieldBase'
    ...   js_type = name
    ...   data = CollectionField()

Now we can use the ``parse_template`` function::

    >>> from rex.widget import parse_template

    >>> parse_template("""
    ... widgets:
    ...   MyHeader: !<Header>
    ...     content: !slot text
    ...     level: 2
    ... """)

The widget is parsed and is registered::

    >>> 'MyHeader' in Widget.map_all()
    True
    >>> MyHeader = Widget.map_all()['MyHeader']
    >>> MyHeader.fields.keys()
    ['text']

Now we can try to instantiate it using YAML::

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
        widget=Header(content='Hello', level=2),
        defer=False),
      state=StateGraph(storage={}, dependents={}))

It also validates the input::

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
        widget=Text(content='Hello, A'),
        defer=False),
      state=StateGraph(storage={}, dependents={}))

    >>> b = make_widget("""
    ... !<B>
    ... """)

    >>> b
    B()

    >>> b.descriptor() # doctest: +NORMALIZE_WHITESPACE
    WidgetDescriptor(ui=UIDescriptor(type='Text', props=<PropsContainer {'content': 'Hello, A'}>,
        widget=Text(content='Hello, A'),
        defer=False),
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
        widget=Text(content='Hello, A'),
        defer=False),
      state=StateGraph(storage={}, dependents={}))

    >>> d = make_widget("""
    ... !<D>
    ... """)

    >>> d
    D()

    >>> d.descriptor() # doctest: +NORMALIZE_WHITESPACE
    WidgetDescriptor(ui=UIDescriptor(type='Text',
        props=<PropsContainer {'content': 'Hello, A'}>,
        widget=Text(content='Hello, A'),
        defer=False),
      state=StateGraph(storage={}, dependents={}))

::

    >>> parse_template("""
    ... widgets:
    ...   WidgetWithMap: !<WidgetWithMapValBase>
    ...     field:
    ...       a: !slot a
    ...       b: !slot
    ...         name: b
    ...         default: B
    ... """)

    >>> 'WidgetWithMap' in Widget.map_all()
    True

    >>> WidgetWithMap = Widget.map_all()['WidgetWithMap']
    >>> WidgetWithMap.fields # doctest: +NORMALIZE_WHITESPACE
    OrderedDict([('a', Field(MaybeUndefinedVal(StrVal()))),
                 ('b', Field(MaybeUndefinedVal(StrVal()), default='B'))])


    >>> widget = make_widget("""
    ... !<WidgetWithMap>
    ... a: "a"
    ... b: "b"
    ... """)
    >>> widget
    WidgetWithMap(a='a', b='b')

    >>> widget.descriptor() # doctest: +NORMALIZE_WHITESPACE
    WidgetDescriptor(ui=UIDescriptor(type='WidgetWithMapValBase',
                       props=<PropsContainer {'field': {'a': 'a', 'b': 'b'}}>,
                       widget=WidgetWithMapValBase(field={'a': 'a', 'b': 'b'}),
                       defer=False),
                     state=StateGraph(storage={}, dependents={}))

    >>> widget = make_widget("""
    ... !<WidgetWithMap>
    ... a: "a"
    ... """)
    >>> widget
    WidgetWithMap(a='a')

    >>> widget.descriptor() # doctest: +NORMALIZE_WHITESPACE
    WidgetDescriptor(ui=UIDescriptor(type='WidgetWithMapValBase',
                       props=<PropsContainer {'field': {'a': 'a', 'b': 'B'}}>,
                       widget=WidgetWithMapValBase(field={'a': 'a', 'b': 'B'}),
                       defer=False),
                     state=StateGraph(storage={}, dependents={}))

    >>> widget = make_widget("""
    ... !<WidgetWithMap>
    ... a: 1
    ... """) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Expected a string
    Got:
        1
    While parsing:
        "<byte string>", line 3
    While constructing widget
        <WidgetWithMap>

::

    >>> parse_template("""
    ... widgets:
    ...   WidgetWithCollectionField: !<WidgetWithCollectionFieldBase>
    ...     data:
    ...       entity: some_entity
    ...       data: !slot data
    ...       refs:
    ...         x: !slot x
    ... """)

    >>> 'WidgetWithCollectionField' in Widget.map_all()
    True

    >>> WidgetWithCollectionField = Widget.map_all()['WidgetWithCollectionField']
    >>> WidgetWithCollectionField.fields # doctest: +NORMALIZE_WHITESPACE
    OrderedDict([('x', Field(MaybeUndefinedVal(DataRefVal()))),
                 ('data', Field(MaybeUndefinedVal(StrVal())))])

    >>> widget = make_widget("""
    ... !<WidgetWithCollectionField>
    ... data: "data"
    ... x: "x"
    ... """)

    >>> widget # doctest: +NORMALIZE_WHITESPACE
    WidgetWithCollectionField(x=(DataRef(ref=Reference('x'), required=False),),
                              data='data')

::

    >>> app.off()
