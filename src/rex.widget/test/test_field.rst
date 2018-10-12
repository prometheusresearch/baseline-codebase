Widget fields
=============

::

  >>> from rex.core import StrVal
  >>> from rex.widget import undefined
  >>> from rex.widget.field import Field, FieldBase

Automatically adjust validator if default is set to ``None``::

  >>> Field(StrVal()).validate('Hi')
  'Hi'

  >>> Field(StrVal()).validate(None) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Expected a string
  Got:
      None

  >>> Field(StrVal(), default='Title').validate(None) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Expected a string
  Got:
      None

  >>> Field(StrVal(), default=None).validate(None)

  >>> Field(StrVal(), default=None).validate('Hi')
  'Hi'

  >>> Field(StrVal(), default=None).validate('Hi')
  'Hi'

Automatically adjust validator if default is set to ``undefined``::

  >>> Field(StrVal()).validate('Hi')
  'Hi'

  >>> Field(StrVal()).validate(undefined) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Expected a string
  Got:
      undefined

  >>> Field(StrVal(), default='Title').validate(undefined) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Expected a string
  Got:
      undefined

  >>> Field(StrVal(), default=undefined).validate(undefined)
  undefined

  >>> Field(StrVal(), default=undefined).validate('Hi')
  'Hi'

  >>> Field(StrVal(), default=undefined).validate('Hi')
  'Hi'

Field validates its default value::

  >>> Field(StrVal(), default=1) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  ValueError: Expected a string
  Got:
      1

Define a new widget field implementation::

  >>> class CustomField(FieldBase):
  ... 
  ...   def __call__(self, widget):
  ...     return 'ok'

  >>> from rex.widget import Widget

  >>> class CustomWidget(Widget):
  ...   field = CustomField()

  >>> w = CustomWidget()

  >>> w.field
  'ok'

