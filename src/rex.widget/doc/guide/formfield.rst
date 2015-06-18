Form fields
===========

Rex Widget uses the :class:`rex.widget.FormField` data structure for configurable
form fields and datatable columns.

Define form field aliases
-------------------------

Sometimes it is useful to define a new form field type as a preconfigured alias
for an existing field type. 

For example we'll create a `sex` field type
which is a preconfigured `enum` with `male` and `female` values.

To do that we need to subclass :class:`rex.widget.FormField` and override its
`__call__(self)` method and `type` class attribute::

    from rex.widget import FormField

    class SexFormField(FormField):
    
        type = 'sex'
    
        def __call__(self):
            return EnumFormField(options=[
                {'value': 'male', 'label': 'Male'},
                {'value': 'female', 'label': 'Female'},
                {'value': 'not-known', 'label': 'Not Known'},
                {'value': 'not-applicable', 'label': 'Not Applicable'}
            ], **self.values)

Override JavaScript component
-----------------------------

It can be useful to create a new type which overrides the JavaScript component used
for rendering a field.

For example we might want a `note` field type which is exactly like 
the `string`
field type but renders as a `<textarea />` 
instead of a plain `<input type="text"/>`.

In Python, we need to create a subclass of :class:`rex.widget.Widget` 
which represents our JavaScript component::

    from rex.core import IntVal
    from rex.widget import Widget, Field

    class TextareaField(Widget):

        js_type = 'package/TextareaField'
        rows = Field(IntVal(), default=4)

Then we can define a new form field type and set its `widget` attribute to
an instance of :class:`TextareaField`::

  from rex.widget import FormField, StringFormField

  class NoteFormField(FormField):

      type = 'note'
      widget = TextareaField()

      def __call__(self):
          return StringFormField(**self.values)

If we want to configure the widget based on the form field configuration we can define a
`widget(self)` method instead::

  class NoteFormField(FormField):

      type = 'note'

      fields = (
              ('rows', IntVal()),
              )

      def widget(self):
          return TextareaField(rows=self.rows)

      def __call__(self):
          values = {k: v for k, v in self.values.items() if k != 'rows'}
          field = StringFormField(**values)
          return field()
