Validating widgets
==================

::

  >>> from rex.core import Rex, StrVal,SeqVal
  >>> from rex.widget import Widget, Field, WidgetVal
  >>> from rex.widget.validate import DeferredVal

  >>> def parse(value, widget_class=None, context=None):
  ...   if context:
  ...     parse_slot_value = DeferredVal().parse
  ...     context = {k: parse_slot_value(v) for k, v in context.items()}
  ...   return WidgetVal(widget_class=widget_class, context=context).parse(value)

  >>> class Example(Widget):
  ...   name = 'Example'
  ...
  ...   title = Field(StrVal())
  ...   desc = Field(StrVal(), default='Desc')

  >>> class Another(Widget):
  ...   name = 'Another'

  >>> rex = Rex('-')
  >>> rex.on()

  >>> parse("""
  ... !<Widget>
  ... title: Title
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Found unknown widget:
      Widget
  While parsing:
      "<...>", line 2

  >>> parse("""
  ... !<Example>
  ... xtitle: x
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Got unexpected field:
      xtitle
  While parsing:
      "<...>", line 3

  >>> parse("""
  ... !<Example>
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Missing mandatory field:
      title
  Of widget:
      Example

  >>> parse("""
  ... !<Example>
  ... title: 1
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a string
  Got:
      1
  While parsing:
      "<...>", line 3
  While validating field:
      title
  Of widget:
      Example

  >>> parse("""
  ... !<Example>
  ... title: Title
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Example(title='Title', desc='Desc')

  >>> parse("""
  ... !<Another>
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Another()

  >>> parse("""
  ... !<Example>
  ... title: Title
  ... desc: Desc!
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Example(title='Title', desc='Desc!')

  >>> parse("""
  ... - !<Example>
  ...   title: Title
  ...   desc: Desc!
  ... - !<Example>
  ...   title: Title2
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  GroupWidget(children=[Example(title='Title', desc='Desc!'),
                        Example(title='Title2', desc='Desc')])

Slots
-----

::

  >>> parse("""
  ... !<Example>
  ... title: !slot
  ...   name: title
  ...   default: Title
  ... """)
  Example(title='Title', desc='Desc')

  >>> w = parse("""
  ... !<Example>
  ... title: !slot
  ...   name: title
  ...   default: 1
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a string
  Got:
      1
  While parsing:
      "<...>", line 5
  While validating field:
      title
  Of widget:
      Example

  >>> parse("""
  ... !<Example>
  ... title: !slot
  ...   name: title
  ...   default: Title
  ... """, context={'title': 'Title!'})
  Example(title='Title!', desc='Desc')
  >>> parse("""
  ... !<Example>
  ... title: !slot
  ...   name: title
  ...   default: Title
  ... """, context={'title': '1'}) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a string
  Got:
      1
  While parsing:
      "<...>", line 1
  While validating field:
      title
  Of widget:
      Example

  >>> from rex.core import MapVal

  >>> class DeepSlots(Widget):
  ...     name = 'DeepSlots'
  ...     js_type = 'DeepSlots'
  ...
  ...     params = Field(MapVal(StrVal(), StrVal()))

  >>> rex.cache.clear()

  >>> parse("""
  ... !<DeepSlots>
  ... params:
  ...   a: b
  ... """)
  DeepSlots(params={'a': 'b'})

  >>> parse("""
  ... !<DeepSlots>
  ... params: !slot
  ...   name: params
  ...   default:
  ...     a: b
  ... """)
  DeepSlots(params={'a': 'b'})

Slots are allowed at arbitrary positions within ``WidgetVal``::

  >>> parse("""
  ... !<DeepSlots>
  ... params:
  ...   a: !slot
  ...     name: a_param
  ...     default: b
  ... """)
  DeepSlots(params={'a': 'b'})

Default values are validated in that case::

  >>> parse("""
  ... !<DeepSlots>
  ... params:
  ...   a: !slot
  ...     name: a_param
  ...     default: 1
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a string
  Got:
      1
  While parsing:
      "<...>", line 6
  While validating field:
      params
  Of widget:
      DeepSlots

When we supply slot value overrides::

  >>> parse("""
  ... !<DeepSlots>
  ... params:
  ...   a: !slot
  ...     name: a_param
  ...     default: b
  ... """, context={'a_param': 'b!'})
  DeepSlots(params={'a': 'b!'})

Slot value overrides are validated as well::

  >>> parse("""
  ... !<DeepSlots>
  ... params:
  ...   a: !slot
  ...     name: a_param
  ...     default: b
  ... """, context={'a_param': '1'}) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a string
  Got:
      1
  While parsing:
      "<...>", line 1
  While validating field:
      params
  Of widget:
      DeepSlots

Specify widget class
--------------------

::

  >>> WidgetVal(widget_class=Example).parse("""
  ... - !<Another>
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected widget of type:
      <Example>
  Instead got widget of type:
      <Another>
  While parsing:
      "<...>", line 2

  >>> WidgetVal(widget_class=Example).parse("""
  ... !<Another>
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected widget of type:
      <Example>
  Instead got widget of type:
      <Another>
  While parsing:
      "<...>", line 2

  >>> WidgetVal(widget_class=Example).parse("""
  ... title: Title
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Example(title='Title', desc='Desc')

  >>> WidgetVal(widget_class=Example).parse("""
  ... !<Example> Title
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Example(title='Title', desc='Desc')

Parsing null
------------

::

  >>> parse("""
  ... null
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  NullWidget()

Failures
--------

::

  >>> parse("1") # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a widget
  Got:
      1
  While parsing:
      "<...>", line 1

  >>> parse("'a'") # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a widget
  Got:
      a
  While parsing:
      "<...>", line 1

  >>> parse("{}") # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a widget
  Got:
      a mapping
  While parsing:
      "<...>", line 1

  >>> rex.cache.clear()

  >>> class WidgetWithRequiredFields(Widget):
  ...   name = 'WidgetWithRequiredFields'
  ...   js_type = 'WidgetWithRequiredFields'
  ...   a = Field(StrVal())
  ...   b = Field(StrVal())

  >>> parse("""
  ... !<WidgetWithRequiredFields> a b
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a mapping
  Got:
      a b
  While parsing:
      "<...>", line 2

Parsing shortcut forms
----------------------

::

  >>> rex.cache.clear()

  >>> class WidgetWithSeq(Widget):
  ...   name = 'WidgetWithSeq'
  ...   js_type = 'WidgetWithSeq'
  ...
  ...   seq = Field(SeqVal(StrVal()))

  >>> parse("""
  ... !<WidgetWithSeq>
  ... seq: [a, b, c]
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  WidgetWithSeq(seq=['a', 'b', 'c'])

  >>> parse("""
  ... !<WidgetWithSeq> [a, b, c]
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  WidgetWithSeq(seq=['a', 'b', 'c'])

Validation
----------

::

  >>> v = WidgetVal()

  >>> v(None)
  NullWidget()

  >>> v([])
  GroupWidget(children=[])

  >>> v([None])
  GroupWidget(children=[NullWidget()])

  >>> v(Example(title='Title'))
  Example(title='Title', desc='Desc')

  >>> v([Example(title='Title')])
  GroupWidget(children=[Example(title='Title', desc='Desc')])

  >>> v('string') # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a widget
  While validating:
      'string'

  >>> v(Example.validated(title=42)) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a string
  Got:
      42
  While validating field:
      title
  Of widget:
      Example
  While validating:
      Example(title=42, desc='Desc')

  >>> v = WidgetVal(widget_class=Example)

  >>> v(Another()) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a widget of type:
      Example
  But got widget of type:
      Another
  While validating:
      Another()

  >>> v([Another()]) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a widget of type:
      Example
  But got widget of type:
      Another
  While validating:
      Another()
  While validating:
      [Another()]

  >>> v(Example(title='Title'))
  Example(title='Title', desc='Desc')

  >>> v([Example(title='Title')])
  GroupWidget(children=[Example(title='Title', desc='Desc')])

Cleanup
-------

::

  >>> rex.off()
