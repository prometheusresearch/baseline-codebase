Test FormField
==============

Init
----
::

  >>> from webob import Request

  >>> from rex.core import LatentRex as Rex, StrVal, SeqVal

  >>> from rex.widget import encode, formfield, FormFieldsetVal, StringFormField


Defining a new built-in type
----------------------------

::

  >>> rex = Rex('-')
  >>> rex.on()

  >>> from rex.widget import FormField, FormFieldVal

  >>> class MyFormField(FormField):
  ...   type = 'my'
  ...   fields = (
  ...     ('prop', StrVal()),
  ...   )

  >>> FormField.all()
  [__main__.MyFormField]

  >>> v = FormFieldVal(default_type='my')

  >>> f = v.parse("""
  ... type: my
  ... value_key: a
  ... prop: Prop
  ... """)

  >>> f
  MyFormField(value_key=['a'], prop='Prop')

  >>> encode(f, None) # doctest: +NORMALIZE_WHITESPACE
  u'{"valueKey": ["a"],
     "widget": null,
     "hint": null,
     "required": false,
     "label": null,
     "readOnly": false,
     "prop": "Prop",
     "type": "my"}'

Set width::

  >>> v.parse("""
  ... type: my
  ... value_key: a
  ... width: 10
  ... prop: prop
  ... """)
  MyFormField(width=10, value_key=['a'], prop='prop')

Errors::

  >>> v.parse("""
  ... type: my
  ... value_key: a
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Missing mandatory field:
      prop
  While parsing:
      "<...>", line 2

  >>> v.parse("""
  ... type: xmy
  ... value_key: a
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected one of:
      my
  Got:
      u'xmy'
  While parsing:
      "<...>", line 2

  >>> rex.off()

Defining a new alias form field type
------------------------------------
::

  >>> rex = Rex('-')
  >>> rex.on()

  >>> class MyFormFieldAlias(FormField):
  ...   type = 'xmy'
  ...   fields = (
  ...     ('xprop', StrVal()),
  ...   )
  ...   def __call__(self):
  ...     return MyFormField(value_key=self.value_key, prop=self.xprop)

  >>> f = v.parse("""
  ... type: xmy
  ... value_key: a
  ... xprop: Prop
  ... """) # doctest: +ELLIPSIS

  >>> f
  MyFormFieldAlias(value_key=['a'], xprop='Prop')

  >>> encode(f, None) # doctest: +NORMALIZE_WHITESPACE
  u'{"valueKey": ["a"],
     "widget": null,
     "hint": null,
     "required": false,
     "label": null,
     "readOnly": false,
     "prop": "Prop",
     "type": "my"}'

  >>> rex.off()

Shortcuts
---------

::

  >>> rex = Rex('rex.widget_demo')
  >>> rex.on()

  >>> v = FormFieldVal()

  >>> v.parse("""
  ... value_key: a.b
  ... """)
  StringFormField(value_key=['a', 'b'])

  >>> v.parse("""
  ... a.b
  ... """)
  StringFormField(value_key=['a', 'b'])

  >>> rex.off()

Form field types
----------------

::

  >>> rex = Rex('rex.widget_demo')
  >>> rex.on()

  >>> v = FormFieldVal()

StringFormField::

  >>> v.parse("""
  ... type: string
  ... value_key: ok
  ... """) # doctest: +NORMALIZE_WHITESPACE
  StringFormField(value_key=['ok'])

  >>> v.parse("""
  ... type: string
  ... value_key: ok
  ... widget: !<TextareaField>
  ... """)
  StringFormField(widget=TextareaField(), value_key=['ok'])


  >>> v.parse("""
  ... type: string
  ... value_key: ok
  ... widget:
  ...   column: !<TextareaField>
  ... """) # doctest: +NORMALIZE_WHITESPACE
  StringFormField(widget=Record(edit=undefined,
                                show=undefined,
                                column=TextareaField()),
                  value_key=['ok'])

EnumFormField::

  >>> f = v.parse("""
  ... type: enum
  ... value_key: sex
  ... options:
  ... - value: male
  ...   label: Male
  ... - value: female
  ...   label: Female
  ... """)

  >>> f # doctest: +NORMALIZE_WHITESPACE
  EnumFormField(value_key=['sex'],
                options=[Record(value='male', label='Male'),
                         Record(value='female', label='Female')])

  >>> encode(f, None) # doctest: +NORMALIZE_WHITESPACE
  u'{"valueKey": ["sex"],
     "widget": null,
     "hint": null,
     "required": false,
     "label": null,
     "readOnly": false,
     "type": "enum",
     "options": [{"value": "male", "^4": "Male"},
                 {"^8": "female", "^4": "Female"}]}'

EntityFormField::

  >>> f = v.parse("""
  ... type: entity
  ... value_key: individual
  ... data:
  ...   entity: individual
  ...   title: identity.givenname
  ... """)

  >>> f # doctest: +NORMALIZE_WHITESPACE
  EntityFormField(value_key=['individual'],
                  data=Record(entity='individual',
                              title='identity.givenname',
                              mask=None))

  >>> f.query_port
  Port('''
  entity: individual
  select: []
  with:
  - calculation: title
    expression: identity.givenname
  ''')

  >>> encode(f, Request.blank('/')) # doctest: +NORMALIZE_WHITESPACE
  u'{"valueKey": ["individual"],
     "widget": null,
     "hint": null,
     "type": "entity",
     "required": false,
     "label": null,
     "readOnly": false,
     "data": ["~#collection", [["~#port", ["http://localhost/?__to__="]], {}]]}'

NoteFormField::

  >>> f = v.parse("""
  ... type: note
  ... value_key: individual
  ... """)

  >>> f
  NoteFormField(widget=TextareaField(), value_key=['individual'])

  >>> encode(f, Request.blank('/')) # doctest: +NORMALIZE_WHITESPACE
  u'{"valueKey": ["individual"],
     "widget": ["~#widget", ["rex-widget/lib/forms/TextareaField", {}]],
     "hint": null,
     "pattern": null,
     "required": false,
     "label": null,
     "readOnly": false,
     "error": null,
     "type": "note"}'

  >>> rex.off()

Generating a fieldset from port definition
------------------------------------------

::

  >>> from rex.port import Port
  >>> from rex.widget.formfield import from_port

  >>> rex = Rex('rex.widget_demo')
  >>> rex.on()

  >>> from_port(Port("individual")) # doctest: +NORMALIZE_WHITESPACE
  [StringFormField(value_key=['code'], required=True, label='Code'),
   EnumFormField(value_key=['sex'], label='Sex',
                 options=[Record(value='not-known', label='Not Known'),
                          Record(value='male', label='Male'),
                          Record(value='female', label='Female'),
                          Record(value='not-applicable', label='Not Applicable')]),
   EntityFormField(value_key=['mother'], label='Mother',
                   data=Record(entity='individual', title='id()', mask=None)),
   EntityFormField(value_key=['father'], label='Father',
                   data=Record(entity='individual', title='id()', mask=None)),
   EntityFormField(value_key=['adopted_mother'], label='Adopted Mother',
                   data=Record(entity='individual', title='id()', mask=None)),
   EntityFormField(value_key=['adopted_father'], label='Adopted Father',
                   data=Record(entity='individual', title='id()', mask=None))]

  >>> from_port(Port("""
  ... entity: individual
  ... select: [id, code]
  ... """)) # doctest: +NORMALIZE_WHITESPACE
  [StringFormField(value_key=['code'], required=True, label='Code')]

  >>> from_port(Port("""
  ... entity: individual
  ... select: [id, code]
  ... with:
  ... - entity: identity
  ...   select: [id, givenname]
  ... """)) # doctest: +NORMALIZE_WHITESPACE
  [StringFormField(value_key=['code'], required=True, label='Code'),
   Fieldset(value_key=['identity'], label='Identity',
            fields=[StringFormField(value_key=['givenname'], label='Givenname')])]

  >>> from_port(Port("""
  ... entity: individual
  ... select: [id, code]
  ... with:
  ... - calculation: example
  ...   expression: code + code
  ... """)) # doctest: +NORMALIZE_WHITESPACE
  [StringFormField(value_key=['code'], required=True, label='Code'),
   CalculatedFormField(value_key=['example'], label='Example', expression='code+code')]

DatetimeFormField
`````````````````

::

  >>> from_port(Port('t_datetime')) # doctest: +NORMALIZE_WHITESPACE
  [StringFormField(value_key=['code'], required=True, label='Code'),
   DatetimeFormField(value_key=['timestamp'], label='Timestamp', widget=DatetimeField(format='YYYY-MM-DD HH:mm:ss')),
   DatetimeFormField(value_key=['timestamp_0'], label='Timestamp_0', widget=DatetimeField(format='YYYY-MM-DD HH:mm:ss')),
   DatetimeFormField(value_key=['timestamptz'], label='Timestamptz', widget=DatetimeField(format='YYYY-MM-DD HH:mm:ss')),
   DatetimeFormField(value_key=['timestamptz_0'], label='Timestamptz_0', widget=DatetimeField(format='YYYY-MM-DD HH:mm:ss'))]

DateFormField
`````````````

::

  >>> from_port(Port('t_date')) # doctest: +NORMALIZE_WHITESPACE
  [StringFormField(value_key=['code'], required=True, label='Code'),
   DateFormField(value_key=['date'], label='Date', widget=DateField(format='YYYY-MM-DD'))]

Cleanup
```````

  >>> rex.off()

Enrich field from port
----------------------

::

  >>> from rex.widget.formfield import enrich

  >>> rex = Rex('rex.widget_demo')
  >>> rex.on()

  >>> v = FormFieldsetVal()

  >>> def test_enrich(entity, yaml):
  ...   fields = v.parse(yaml)
  ...   port = formfield.to_port(entity, fields)
  ...   return enrich(fields, port)

  >>> test_enrich('individual', """
  ... - code
  ... - sex
  ... """) # doctest: +NORMALIZE_WHITESPACE
  [StringFormField(value_key=['code'], required=True, label='Code'),
   EnumFormField(value_key=['sex'], label='Sex',
                 options=[Record(value='not-known', label='Not Known'),
                          Record(value='male', label='Male'),
                          Record(value='female', label='Female'),
                          Record(value='not-applicable', label='Not Applicable')])]

  >>> test_enrich('individual', """
  ... - code
  ... - identity.givenname
  ... """) # doctest: +NORMALIZE_WHITESPACE
  [StringFormField(value_key=['code'], required=True, label='Code'),
   StringFormField(value_key=['identity', 'givenname'], label='Givenname')]

  >>> fields = test_enrich('individual', """
  ... - code
  ... - mother
  ... """)

  >>> fields # doctest: +NORMALIZE_WHITESPACE
  [StringFormField(value_key=['code'], required=True, label='Code'),
   EntityFormField(value_key=['mother'], label='Mother', data=Record(entity='individual', title='id()', mask=None))]

  >>> fields[1].query_port
  Port('''
  entity: individual
  select: []
  with:
  - calculation: title
    expression: id()
  ''')

  >>> fields = test_enrich('table_with_link_to_table_with_title', """
  ... - table_with_title
  ... """)
  
  >>> fields # doctest: +NORMALIZE_WHITESPACE
  [EntityFormField(value_key=['table_with_title'],
                   required=True,
                   label='Table With Title',
                   data=Record(entity='table_with_title',
                               title='title',
                               mask=None))]

  >>> fields[0].query_port
  Port('''
  entity: table_with_title
  select: [id]
  with:
  - calculation: title
    expression: title
  ''')

  >>> fields[0].query_port.produce()
  <Product {()}>

  >>> rex.off()

Generating port from fieldset
-----------------------------

::

  >>> from rex.widget.formfield import _nest

  >>> rex = Rex('-', 'rex.widget_demo')
  >>> rex.on()

  >>> def test(yaml):
  ...   return _nest(FormFieldsetVal().parse(yaml))

  >>> test("""
  ... - value_key: a
  ... """)
  [StringFormField(value_key=['a'])]

  >>> test("""
  ... - value_key: a
  ... - value_key: b
  ... """) # doctest: +NORMALIZE_WHITESPACE
  [StringFormField(value_key=['a']),
   StringFormField(value_key=['b'])]

  >>> test("""
  ... - value_key: a.b
  ... """) # doctest: +NORMALIZE_WHITESPACE
  [Fieldset(value_key=['a'],
            fields=[StringFormField(value_key=['b'])])]

  >>> test("""
  ... - value_key: a.b.c
  ... """) # doctest: +NORMALIZE_WHITESPACE
  [Fieldset(value_key=['a'],
            fields=[Fieldset(value_key=['b'],
                             fields=[StringFormField(value_key=['c'])])])]

  >>> test("""
  ... - value_key: a.b.c
  ... - value_key: a.d
  ... """) # doctest: +NORMALIZE_WHITESPACE
  [Fieldset(value_key=['a'],
            fields=[Fieldset(value_key=['b'],
                             fields=[StringFormField(value_key=['c'])]),
                    StringFormField(value_key=['d'])])]

  >>> test("""
  ... - value_key: a.d
  ... - value_key: a.b.c
  ... """) # doctest: +NORMALIZE_WHITESPACE
  [Fieldset(value_key=['a'],
            fields=[StringFormField(value_key=['d']),
                    Fieldset(value_key=['b'],
                             fields=[StringFormField(value_key=['c'])])])]

  >>> test("""
  ... - value_key: a
  ...   type: fieldset
  ...   fields:
  ...   - value_key: c
  ... - value_key: a.b
  ... """) # doctest: +NORMALIZE_WHITESPACE
  [Fieldset(value_key=['a'],
            fields=[StringFormField(value_key=['c']),
                    StringFormField(value_key=['b'])])]

  >>> test("""
  ... - value_key: a.b
  ... - value_key: a
  ...   type: fieldset
  ...   fields:
  ...   - value_key: c
  ... """) # doctest: +NORMALIZE_WHITESPACE
  [Fieldset(value_key=['a'],
            fields=[StringFormField(value_key=['b']),
                    StringFormField(value_key=['c'])])]

Port generation::

  >>> from rex.widget.formfield import to_port

Generating ports from fields::

  >>> def test_fields(entity, fields, **kw):
  ...   fields = FormFieldsetVal().parse(fields)
  ...   return to_port(entity, fields, **kw)

  >>> test_fields('todo', """
  ... - value_key: description
  ... """)
  Port('''
  entity: todo
  select: [description]
  ''')

  >>> test_fields('todo', """
  ... - value_key: id
  ... - value_key: description
  ... """)
  Port('''
  entity: todo
  select: [description, id]
  ''')

  >>> test_fields('individual', """
  ... - value_key: code
  ... - value_key: identity.givenname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname]
  ''')

  >>> test_fields('individual', """
  ... - value_key: code
  ... - value_key: identity.givenname
  ... - value_key: identity.surname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname, surname]
  ''')

  >>> test_fields('individual', """
  ... - value_key: code
  ... - value_key: identity
  ...   type: fieldset
  ...   fields:
  ...   - value_key: givenname
  ...   - value_key: surname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname, surname]
  ''')

  >>> test_fields('individual', """
  ... - value_key: code
  ... - value_key: identity
  ...   type: fieldset
  ...   fields:
  ...   - value_key: surname
  ... - value_key: identity.givenname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname, surname]
  ''')

  >>> test_fields('individual', """
  ... - value_key: code
  ... - value_key: identity.givenname
  ... - value_key: identity
  ...   type: fieldset
  ...   fields:
  ...   - value_key: surname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname, surname]
  ''')

  >>> test_fields('individual', """
  ... - value_key: code
  ... - value_key: identity
  ...   type: fieldset
  ...   fields:
  ...   - value_key: givenname
  ... - value_key: identity
  ...   type: fieldset
  ...   fields:
  ...   - value_key: surname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname, surname]
  ''')

  >>> test_fields('individual', """
  ... - value_key: code
  ... - type: calculation
  ...   value_key: mother_code
  ...   expression: mother.code
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - calculation: mother_code
    expression: mother.code
  ''')

  >>> test_fields('individual', """
  ... - value_key: code
  ... - value_key: identity.givenname
  ... - type: calculation
  ...   value_key: identity.just_null
  ...   expression: null()
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname]
    with:
    - calculation: just_null
      expression: null()
  ''')

  >>> test_fields('individual', """
  ... - value_key: code
  ... - type: calculation
  ...   value_key: identity.just_null
  ...   expression: null()
  ... - value_key: identity.givenname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname]
    with:
    - calculation: just_null
      expression: null()
  ''')

  >>> test_fields('individual', """
  ... - value_key: code
  ... - type: calculation
  ...   value_key: identity.just_null
  ...   expression: null()
  ... - type: fieldset
  ...   value_key: identity
  ...   fields:
  ...   - value_key: givenname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname]
    with:
    - calculation: just_null
      expression: null()
  ''')

Masks::

  >>> test_fields('individual', """
  ... - value_key: code
  ... """, mask="sex = 'male'")
  Port('''
  entity: individual
  mask: sex='male'
  select: [code]
  ''')

Filters::

  >>> test_fields('individual', """
  ... - value_key: code
  ... """, filters=["sex($sex) := sex = $sex"])
  Port('''
  entity: individual
  filters: ['sex($sex) := sex=$sex']
  select: [code]
  ''')

Generating ports from columns::

  >>> from rex.widget import ColumnVal

  >>> def test_columns(entity, columns):
  ...   columns = SeqVal(ColumnVal()).parse(columns)
  ...   return to_port(entity, columns)

  >>> test_columns('todo', """
  ... - value_key: description
  ... """)
  Port('''
  entity: todo
  select: [description]
  ''')

  >>> test_columns('todo', """
  ... - value_key: id
  ... - value_key: description
  ... """)
  Port('''
  entity: todo
  select: [description, id]
  ''')

  >>> test_columns('individual', """
  ... - value_key: code
  ... - value_key: identity.givenname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname]
  ''')

  >>> test_columns('individual', """
  ... - value_key: code
  ... - value_key: identity.givenname
  ... - value_key: identity.surname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname, surname]
  ''')

  >>> test_columns('individual', """
  ... - value_key: code
  ... - value_key: identity
  ...   type: fieldset
  ...   fields:
  ...   - value_key: givenname
  ...   - value_key: surname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname, surname]
  ''')

  >>> test_columns('individual', """
  ... - value_key: code
  ... - value_key: identity
  ...   type: fieldset
  ...   fields:
  ...   - value_key: surname
  ... - value_key: identity.givenname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname, surname]
  ''')

  >>> test_columns('individual', """
  ... - value_key: code
  ... - value_key: identity.givenname
  ... - value_key: identity
  ...   type: fieldset
  ...   fields:
  ...   - value_key: surname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname, surname]
  ''')

  >>> test_columns('individual', """
  ... - value_key: code
  ... - value_key: identity
  ...   type: fieldset
  ...   fields:
  ...   - value_key: givenname
  ... - value_key: identity
  ...   type: fieldset
  ...   fields:
  ...   - value_key: surname
  ... """)
  Port('''
  entity: individual
  select: [code]
  with:
  - entity: identity
    select: [givenname, surname]
  ''')

Cleanup::

  >>> rex.off()

FormFieldsetVal with layout
---------------------------

Working with YAML API::

  >>> from rex.widget.formfield import FormFieldsetVal

  >>> rex = Rex('rex.widget_demo')
  >>> rex.on()

  >>> parse = FormFieldsetVal().parse

  >>> parse("""
  ... - type: string
  ...   value_key: code
  ... """)
  [StringFormField(value_key=['code'])]

  >>> parse("""
  ... - type: string
  ...   value_key: code
  ...   widget: !<TextareaField>
  ... """)
  [StringFormField(widget=TextareaField(), value_key=['code'])]

  >>> fs = parse("""
  ... - row:
  ...   - type: string
  ...     value_key: code
  ... """)

  >>> fs # doctest: +NORMALIZE_WHITESPACE
  [FormRow(size=undefined,
           fields=[StringFormField(value_key=['code'])],
           select_form_value=True)]

  >>> to_port('individual', fs)
  Port('''
  entity: individual
  select: [code]
  ''')

  >>> enrich(fs, Port('individual')) # doctest: +NORMALIZE_WHITESPACE
  [FormRow(size=undefined,
           fields=[StringFormField(value_key=['code'], required=True, label='Code')],
           select_form_value=True)]

  >>> fs = parse("""
  ... - column:
  ...   - type: string
  ...     value_key: code
  ... """)

  >>> fs # doctest: +NORMALIZE_WHITESPACE
  [FormColumn(size=undefined,
              fields=[StringFormField(value_key=['code'])],
              select_form_value=True)]

  >>> to_port('individual', fs)
  Port('''
  entity: individual
  select: [code]
  ''')

  >>> enrich(fs, Port('individual')) # doctest: +NORMALIZE_WHITESPACE
  [FormColumn(size=undefined,
              fields=[StringFormField(value_key=['code'], required=True, label='Code')],
              select_form_value=True)]

  >>> fs = parse("""
  ... - column:
  ...   - row:
  ...     - type: string
  ...       value_key: code
  ... """)

  >> fs
  [FormColumn(children=[FormRow(children=[StringFormField(value_key=['code'])])])]

  >>> to_port('individual', fs)
  Port('''
  entity: individual
  select: [code]
  ''')

  >>> enrich(fs, Port('individual')) # doctest: +NORMALIZE_WHITESPACE
  [FormColumn(size=undefined,
              fields=[FormRow(size=undefined,
                              fields=[StringFormField(value_key=['code'],
                                      required=True,
                                      label='Code')],
                              select_form_value=True)],
              select_form_value=True)]

Working with Python API::

  >>> validate = FormFieldsetVal()

  >>> validate([
  ... {'row': [
  ...   StringFormField(value_key='code'),
  ...   StringFormField(value_key='id')
  ... ]},
  ... {'row': [
  ...   StringFormField(value_key='code'),
  ...   StringFormField(value_key='id')
  ... ]},
  ... ]) # doctest: +NORMALIZE_WHITESPACE
  [FormRow(size=undefined,
           fields=[StringFormField(value_key=['code']),
                   StringFormField(value_key=['id'])], select_form_value=True),
   FormRow(size=undefined,
           fields=[StringFormField(value_key=['code']),
                   StringFormField(value_key=['id'])], select_form_value=True)]

EntityFieldsetVal()
-------------------

:class:`EntityFieldsetVal` validator is used when you need to specify that the
fieldset relates to a tabke in database (an entity). It then performs db
reflection to enrich form fieldset metadat (automatically infer field types and
so on)::

    >>> from rex.widget.formfield import EntityFieldsetVal

We can specify entity in when defining a validator::

    >>> parse = EntityFieldsetVal('individual').parse

    >>> EntityFieldsetVal('individual').parse("""
    ... - sex
    ... - identity.givenname
    ... - mother
    ... """) # doctest: +NORMALIZE_WHITESPACE
    [EnumFormField(value_key=['sex'], label='Sex',
                   options=[Record(value='not-known', label='Not Known'),
                            Record(value='male', label='Male'),
                            Record(value='female', label='Female'),
                            Record(value='not-applicable', label='Not Applicable')]),
     StringFormField(value_key=['identity', 'givenname']),
     EntityFormField(value_key=['mother'], label='Mother', data=Record(entity='individual', title='id()', mask=None))]

    >>> parse("""
    ... - value_key: sex
    ...   widget: !<TextareaField>
    ... """) # doctest: +NORMALIZE_WHITESPACE
    [EnumFormField(value_key=['sex'],
                   label='Sex',
                   widget=TextareaField(), 
                   options=[Record(value='not-known', label='Not Known'),
                            Record(value='male', label='Male'),
                            Record(value='female', label='Female'),
                            Record(value='not-applicable', label='Not Applicable')])]

Alternatively we can supply entity name in YAML::

    >>> EntityFieldsetVal().parse("""
    ... entity: individual
    ... fields:
    ... - sex
    ... - identity.givenname
    ... - mother
    ... """) # doctest: +NORMALIZE_WHITESPACE
    [EnumFormField(value_key=['sex'], label='Sex',
                   options=[Record(value='not-known', label='Not Known'),
                            Record(value='male', label='Male'),
                            Record(value='female', label='Female'),
                            Record(value='not-applicable', label='Not Applicable')]),
     StringFormField(value_key=['identity', 'givenname']),
     EntityFormField(value_key=['mother'], label='Mother', data=Record(entity='individual', title='id()', mask=None))]

Cleanup::

  >>> rex.off()

Built-in types
--------------

::

  >>> rex = Rex('rex.widget')
  >>> rex.on()

  >>> sorted(FormField.mapped().items()) # doctest: +NORMALIZE_WHITESPACE
  [('bool', rex.widget.formfield.BoolFormField),
   ('calculation', rex.widget.formfield.CalculatedFormField),
   ('date', rex.widget.formfield.DateFormField),
   ('datetime', rex.widget.formfield.DatetimeFormField),
   ('entity', rex.widget.formfield.EntityFormField),
   ('enum', rex.widget.formfield.EnumFormField),
   ('fieldset', rex.widget.formfield.Fieldset),
   ('file', rex.widget.formfield.FileFormField),
   ('integer', rex.widget.formfield.IntegerFormField),
   ('list', rex.widget.formfield.List),
   ('note', rex.widget.formfield.NoteFormField),
   ('number', rex.widget.formfield.NumberFormField),
   ('string', rex.widget.formfield.StringFormField)]

  >>> rex.off()
