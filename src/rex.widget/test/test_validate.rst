Test rex.widget.validate
========================

DeferredVal
-----------

::

  >>> from rex.widget.validate import DeferredVal

  >>> val = DeferredVal()
  >>> deferred = val.parse('1')

  >>> deferred # doctest: +ELLIPSIS
  <rex.widget.validate.DeferredConstruction object at ...>

  >>> val(deferred) is deferred
  True

  >>> deferred.source_location.start.line
  0
  >>> deferred.source_location.end.line
  0

  >>> deferred.resolve()
  1

  >>> deferred = val(1)
  >>> deferred # doctest: +ELLIPSIS
  <rex.widget.validate.DeferredValidation object at ...>

  >>> val(deferred) is deferred
  True

  >>> deferred.source_location is None
  True

  >>> deferred.resolve()
  1

WidgetVal
---------

::

  >>> from rex.core import Rex, StrVal,SeqVal
  >>> from rex.widget import Widget, Field, WidgetVal, MaybeUndefinedVal, undefined
  >>> from rex.widget.validate import DeferredVal

  >>> def parse(value, widget_class=None):
  ...   return WidgetVal(widget_class=widget_class).parse(value)

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
  While parsing:
      "<...>", line 2

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
  Example(desc='Desc', title='Title')

  >>> parse("""
  ... !<Another>
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Another()

  >>> parse("""
  ... !<Example>
  ... title: Title
  ... desc: Desc!
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Example(desc='Desc!', title='Title')

  >>> parse("""
  ... - !<Example>
  ...   title: Title
  ...   desc: Desc!
  ... - !<Example>
  ...   title: Title2
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  GroupWidget(children=[Example(desc='Desc!', title='Title'),
                        Example(desc='Desc', title='Title2')])

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
  Example(desc='Desc', title='Title')

  >>> WidgetVal(widget_class=Example).parse("""
  ... !<Example> Title
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Example(desc='Desc', title='Title')

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
  ...   js_type = 'pkg', 'WidgetWithRequiredFields'
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
  ...   js_type = 'pkg', 'WidgetWithSeq'
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
  Example(desc='Desc', title='Title')

  >>> v([Example(title='Title')])
  GroupWidget(children=[Example(desc='Desc', title='Title')])

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
      Example(desc='Desc', title=42)

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
  Example(desc='Desc', title='Title')

  >>> v([Example(title='Title')])
  GroupWidget(children=[Example(desc='Desc', title='Title')])

Cleanup
-------

::

  >>> rex.off()
