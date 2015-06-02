Form fields
===========

Rex Widget uses :class:`rex.widget.FormField` data structure for configurable
form fields and datatable columns.

Define form field aliases
-------------------------

Sometimes it is useful to define new form field type as a preconfigured alias
for an existent field type. For example we might want to have ``sex`` field type
which is a preconfigured ``enum`` with ``male`` and ``female`` values.

To do that we need to subclass :class:`rex.widget.FormField` and override its
``__call__(self)`` method and ``type`` class attribute::

    from rex.widget import FormField

    class SexFormField(FormField):
    
        type = 'sex'
    
        def __call__(self):
            enum = EnumFormField(options=[
                {'value': 'male', 'label': 'Male'},
                {'value': 'female', 'label': 'Female'},
                {'value': 'not-known', 'label': 'Not Known'},
                {'value': 'not-applicable', 'label': 'Not Applicable'}
            ], **self.values)
            return enum()

Override JavaScript component
-----------------------------

It can be useful to create a new type which overrides JavaScript component used
for rendering a field.

For example we might want a ``note`` field type which is exactly like ``string``
field type but renders as ``<textarea />`` instead of plain ``<input type="text"
/>``.

First we need to define :class:`rex.widget.Widget` which represents JavaScript
component::

    from rex.core import IntVal
    from rex.widget import Widget, Field

    class TextareaField(Widget):
        js_type = 'package/TextareaField'

        rows = Field(IntVal(), default=4)

Then we can define a new form field type and set ``widget`` attribute to
:class:`TextareaField` instance::

  from rex.widget import FormField, StringFormField

  class NoteFormField(FormField):

      type = 'note'
      widget = TextareaField()

      def __call__(self):
          field = StringFormField(**self.values)
          return field()

If we want to configure widget based on form field configuration we can define a
``widget(self)`` method instead::

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
