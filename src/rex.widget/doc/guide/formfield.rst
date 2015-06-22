Form fields
===========

Rex Widget features configurable and exensible form mechanism via
``<ConfigurableEntityForm />`` React component and a set of configuration
validators to specify fieldsets from URL mapping.

Configuring form fields
-----------------------

To define a widget which uses ``<ConfigurableEntityForm />`` you need to
use :class:`FormFieldsetVal` validator for form fields::

    from rex.widget import Widget, Field, FormFieldsetVal

    class IndividualForm(Widget):

        name = 'IndividualForm'
        js_type = 'my-package/IndividualForm'

        fields = Field(
            FormFieldsetVal(),
            doc="""
            Form fields.
            """)

Then corresponding ``my-package/IndividualForm`` React component should pass
``this.props.fields`` to ``<ConfigurableEntityForm />``::

    var React = require('react')
    var RexWidget = require('rex-widget')

    var IndividualForm = React.createClass({

      render() {
        return (
          <div>
            <h1>IndividualForm</h1>
            <RexWidget.ConfigurableEntityForm
              fields={this.props.fields}
              />
          </div>
        )
      }
    })

Then configure ``<IndividualForm>`` via URL mapping configuration::

    !<IndividualForm>
    fields:
    - type: string
      value_key: name
    - type: entity
      value_key: mother
      data:
        entity: individual
        title: identity.givenname + ' ' + identity.surname

Configuring entity form fields
------------------------------

Most of the time your form submit data through Rex Port and work with a
predefined database entities (rather than using arbitrary HTSQL queries).

Rex Widget can take advantage of this and infer form field types and other
information right from the Rex Port definition. To instruct Rex Widget to do so
you need to use :class:`EntityFieldsetVal` validator::

    from rex.widget import Widget, Field, EntityFieldsetVal

    class IndividualForm(Widget):

        name = 'IndividualForm'
        js_type = 'my-package/IndividualForm'

        fields = Field(
            EntityFieldsetVal(entity='individual'),
            doc="""
            Form fields.
            """)

The React component stays the same but in YAML configuration you can just define
fields as ``value_key: ...`` sequence::

    !<IndividualForm>
    fields:
    - value_key: name
    - value_key: mother

You can even supply it a sequence of string which will be treated as ``value_key`` values::

    !<IndividualForm>
    fields:
    - name
    - mother

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


Now in YAML, when declaring the fields to use on a form you can use:: 

     type: sex
     value_key: sex

Instead of::

     type: enum
     value_key: sex
     options:
     - value: male
       label: Male
     - value: female
       label: Female


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
