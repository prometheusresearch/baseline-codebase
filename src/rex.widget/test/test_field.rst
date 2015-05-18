Widget fields
=============

Define a new widget field implementation::

  >>> from rex.widget.field import FieldBase

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
