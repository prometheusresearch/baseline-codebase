Test constructing widgets from widget descriptions
==================================================

Initialize the Rex application::

    >>> import rex.ctl

    >>> from rex.core import Rex
    >>> app = Rex('-')
    >>> app.on()

Widgets can be instantiated through the YAML configuration. The
:mod:`rex.widget.parse` module allows to parse YAML into syntactically correct
object model. The next step is to turn such object model into a widget instance
by performing validations.

We define a helper ``make`` function which parses the YAML snippet and performs
validation to create a widget instance::

    >>> from rex.widget.parse import parse
    >>> from rex.widget.validate import validate

    >>> def make(yaml_str):
    ...   return validate(parse(yaml_str))

We also need to define several widget classes which will be used along the this
document::

    >>> from rex.core import StrVal, IntVal
    >>> from rex.widget.widget import Widget, GroupWidget
    >>> from rex.widget.field import Field, undefined

Widget with a single mandatory field::

    >>> class Text(Widget):
    ...   name = 'Text'
    ...   js_type = 'Text'
    ...   content = Field(StrVal())

Widget with multiple mandatory fields::

    >>> class Header(Widget):
    ...   name = 'Header'
    ...   js_type = 'Header'
    ...   content = Field(StrVal())
    ...   level = Field(IntVal())

Widget with mandatory and optional fields::

    >>> class Label(Widget):
    ...   name = 'Label'
    ...   js_type = 'Label'
    ...   text = Field(StrVal())
    ...   size = Field(IntVal(), default=undefined)

Validating already constructed widgets
--------------------------------------

Widget instances can be validated::

    >>> validate(Text(content="Hello"))
    Text(content='Hello')

It catches all the errors to widget fields::

    >>> validate(Text(content=1)) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Expected a string
    Got:
        1
    While validating field:
        content

    >>> validate(Text()) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Missing mandatory field:
        content

    >>> validate(Text(extra=1)) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Got unexpected field:
        extra

The custom instance of ``WidgetVal`` can be used for sophisticated validations,
for example we can only allow widgets of type ``Text``::

    >>> from rex.widget import WidgetVal
    >>> validate_text = WidgetVal(Text)

    >>> validate_text(Text(content='OK'))
    Text(content='OK')

    >>> validate_text(Label(text='OK')) # doctest: +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
    ...
    Error: Invalid widget:
        <Label>
    Expected a widget of type:
        <Text>

Note that inheritance is respected::

    >>> class SuperText(Text):
    ...   name = 'SuperText'
    ...   js_type = 'SuperText'

    >>> validate_text(SuperText(content='OK'))
    SuperText(content='OK')

Creating widgets from YAML representation
-----------------------------------------

If widget cannot be resolved then it's an error::

    >>> make("""
    ... !<Unknown>
    ... """) # doctest: +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
    ...
    Error: Unknown widget found:
        <Unknown>
    While parsing:
        "<byte string>", line 2

If it's not a widget then it's an error::

    >>> make("""
    ... Hello
    ... """) # doctest: +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
    ...
    Error: Expected a widget but got:
        'Hello'
    While parsing:
        "<byte string>", line 2

    >>> make("""
    ... a: 1
    ... """) # doctest: +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
    ...
    Error: Expected a widget but got:
        {'a': 1}
    While parsing:
        "<byte string>", line 2

    >>> make("""
    ... - 1
    ... """) # doctest: +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
    ...
    Error: Expected a widget but got:
        1
    While parsing:
        "<byte string>", line 2


Creating a ``NullWidget``::

    >>> make("null")
    NullWidget()


Widget with a single mandatory field
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

    >>> make("""
    ... !<Text>
    ... content: Hello
    ... """)
    Text(content='Hello')

::

    >>> make("""
    ... !<Text> Hello
    ... """)
    Text(content='Hello')

::

    >>> make("""
    ... - !<Text> "1"
    ... - !<Text> "2"
    ... """)
    GroupWidget(children=[Text(content='1'), Text(content='2')])

::

    >>> make("""
    ... !<Text>
    ... content: 1
    ... """) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
    ...
    Error: Expected a string
    Got:
        1
    While parsing:
        "<byte string>", line 3
    While constructing widget
        <Text>

::

    >>> make("""
    ... !<Text>
    ... content: OK
    ... extra: NOK
    ... """) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
    ...
    Error: Got unexpected field:
        extra
    While parsing:
        "<byte string>", line 4
    While constructing widget
        <Text>

::

    >>> make("""
    ... !<Text>
    ... content: OK
    ... content: NOK
    ... """) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
    ...
    Error: Got duplicate field:
        content
    While parsing:
        "<byte string>", line 4
    While parsing widget:
        <Text>
    While parsing:
        "<byte string>", line 2

::

    >>> make("""
    ... !<Text>
    ... """) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
    ...
    Error: Missing mandatory fields:
        content
    While parsing:
        "<byte string>", line 2
    While constructing widget
        <Text>

Widget with multiple mandatory fields
-------------------------------------

::

    >>> make("""
    ... !<Header>
    ... content: Head
    ... level: 2
    ... """) # doctest: +ELLIPSIS
    Header(content='Head', level=2)

::

    >>> make("""
    ... !<Header>
    ... """) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Missing mandatory fields:
        content, level
    While parsing:
        "<byte string>", line 2
    While constructing widget
        <Header>

::

    >>> make("""
    ... !<Header>
    ... content: Head
    ... """) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Missing mandatory fields:
        level
    While parsing:
        "<byte string>", line 2
    While constructing widget
        <Header>

::

    >>> make("""
    ... !<Header>
    ... level: 2
    ... """) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Missing mandatory fields:
        content
    While parsing:
        "<byte string>", line 2
    While constructing widget
        <Header>

::

    >>> make("""
    ... !<Header> Head
    ... """) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Shorthand notation is not available for widgets
        with more than a single mandatory field
    While parsing:
        "<byte string>", line 2
    While constructing widget
        <Header>

Widget with optional parameter
------------------------------

::

    >>> make("""
    ... !<Label>
    ... text: label
    ... """) # doctest: +ELLIPSIS
    Label(text='label')

::

    >>> make("""
    ... !<Label>
    ... text: label
    ... size: 2
    ... """) # doctest: +ELLIPSIS
    Label(text='label', size=2)

::

    >>> make("""
    ... !<Label> label
    ... """) # doctest: +ELLIPSIS
    Label(text='label')

::

    >>> make("""
    ... !<Label> 2
    ... """) # doctest: +ELLIPSIS
    Label(text='2')

Setting an expection for a widget
---------------------------------

::

    >>> from rex.widget.validate import WidgetVal

    >>> construct_label = WidgetVal(Label)

    >>> def make_label(yaml_str, single=False):
    ...   construct_label = WidgetVal(Label, single=single)
    ...   return construct_label(parse(yaml_str))

::

    >>> make_label("""
    ... !<Label> 2
    ... """) # doctest: +ELLIPSIS
    Label(text='2')

::

    >>> make_label("""
    ... - !<Label> 1
    ... - !<Label> 2
    ... """) # doctest: +ELLIPSIS
    GroupWidget(children=[Label(text='1'), Label(text='2')])

::

    >>> make_label("""
    ... - !<Label> 1
    ... - !<Label> 2
    ... """, single=True) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Only single widget is allowed
    While constructing widget:
        <GroupWidget>
    While parsing:
        "<byte string>", line 2

::

    >>> make_label("""
    ... text: hello
    ... """) # doctest: +ELLIPSIS
    Label(text='hello')

::

    >>> make_label("""
    ... - text: "1"
    ... - text: "2"
    ... """) # doctest: +ELLIPSIS
    GroupWidget(children=[Label(text='1'), Label(text='2')])

::

    >>> make_label("""
    ... !<Header>
    ... content: hello
    ... level: 2
    ... """) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Invalid widget:
        <Header>
    Expected a widget of type:
        <Label>
    While constructing widget:
        <Header>
    While parsing:
        "<byte string>", line 2

::

    >>> make_label("""
    ... text: 2
    ... """)  # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Expected a string
    Got:
        2
    While parsing:
        "<byte string>", line 2
    While constructing widget
        <Label>

::

    >>> label = Label(text="Hello")
    >>> WidgetVal(Label)(label)
    Label(text='Hello')

::

    >>> label = Label(text="Hello")
    >>> WidgetVal(Label)(GroupWidget(children=[label, label]))
    GroupWidget(children=[Label(text='Hello'), Label(text='Hello')])

::

    >>> label = Label(text="Hello")
    >>> WidgetVal(Label)([label, label])
    GroupWidget(children=[Label(text='Hello'), Label(text='Hello')])

::

    >>> label = Label(text="Hello")
    >>> WidgetVal(Label, single=True)(GroupWidget(children=[label, label])) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Only single widget is allowed

::

    >>> label = Label(text="Hello")
    >>> WidgetVal(Label, single=True)([label, label]) # doctest: +ELLIPSIS
    Traceback (most recent call last):
    ...
    Error: Only single widget is allowed
    While constructing widget:
        <GroupWidget>


Cleanup
-------

::

    >>> app.off()

