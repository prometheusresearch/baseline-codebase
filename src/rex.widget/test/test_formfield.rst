Test FormField
==============

Init
----
::

  >>> from rex.core import LatentRex as Rex, StrVal

  >>> from rex.widget import encode


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

  >>> encode(f, None)
  u'["^ ","readOnly",false,"valueKey",["a"],"required",false,"type","my","prop","Prop"]'

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
      'xmy'
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
  ...     underlying = MyFormField(value_key=self.value_key, prop=self.xprop)
  ...     return underlying()

  >>> f = v.parse("""
  ... type: xmy
  ... value_key: a
  ... xprop: Prop
  ... """) # doctest: +ELLIPSIS

  >>> f
  MyFormFieldAlias(value_key=['a'], xprop='Prop')

  >>> encode(f, None)
  u'["^ ","readOnly",false,"valueKey",["a"],"required",false,"type","my","prop","Prop"]'

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

Generating a fieldset from port definition
------------------------------------------

::

  >>> from rex.port import Port
  >>> from rex.widget.formfield import from_port

  >>> rex = Rex('rex.widget_demo')
  >>> rex.on()

  >>> from_port(Port("individual")) # doctest: +NORMALIZE_WHITESPACE
  Fieldset(value_key=['__root__'], label='Root',
           fields=[StringFormField(value_key=['id'], label='id'),
                   StringFormField(value_key=['code'], label='Code'),
                   StringFormField(value_key=['sex'], label='Sex'),
                   StringFormField(value_key=['mother'], label='Mother'),
                   StringFormField(value_key=['father'], label='Father'),
                   StringFormField(value_key=['adopted_mother'], label='Adopted Mother'),
                   StringFormField(value_key=['adopted_father'], label='Adopted Father')])

  >>> from_port(Port("""
  ... entity: individual
  ... select: [id, code]
  ... """)) # doctest: +NORMALIZE_WHITESPACE
  Fieldset(value_key=['__root__'], label='Root',
           fields=[StringFormField(value_key=['id'], label='id'),
                   StringFormField(value_key=['code'], label='Code')])

  >>> from_port(Port("""
  ... entity: individual
  ... select: [id, code]
  ... with:
  ... - entity: identity
  ...   select: [id, givenname]
  ... """)) # doctest: +NORMALIZE_WHITESPACE
  Fieldset(value_key=['__root__'], label='Root',
           fields=[StringFormField(value_key=['id'], label='id'),
                   StringFormField(value_key=['code'], label='Code'),
                   Fieldset(value_key=['identity'], label='Identity',
                            fields=[StringFormField(value_key=['id'], label='id'),
                                    StringFormField(value_key=['givenname'], label='Given Name')])])

  >>> rex.off()

Generating port from fieldset
-----------------------------

::

  >>> from rex.core import SeqVal
  >>> from rex.widget.formfield import _nest

  >>> rex = Rex('-', 'rex.widget_demo')
  >>> rex.on()

  >>> def test(yaml):
  ...   return _nest(SeqVal(FormFieldVal()).parse(yaml))

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
            fields=[Fieldset(value_key=['b'],
                             fields=[StringFormField(value_key=['c'])]),
                    StringFormField(value_key=['d'])])]

  >>> test("""
  ... - value_key: a
  ...   type: fieldset
  ...   fields:
  ...   - value_key: c
  ... - value_key: a.b
  ... """) # doctest: +NORMALIZE_WHITESPACE
  [Fieldset(value_key=['a'],
            fields=[StringFormField(value_key=['b']),
                    StringFormField(value_key=['c'])])]

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

  >>> def test_fields(entity, fields):
  ...   fields = SeqVal(FormFieldVal()).parse(fields)
  ...   return to_port(entity, fields)

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
  ... - type: calc
  ...   value_key: mother_code
  ...   expr: mother.code
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
  ... - type: calc
  ...   value_key: identity.just_null
  ...   expr: null()
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
  ... - type: calc
  ...   value_key: identity.just_null
  ...   expr: null()
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
  ... - type: calc
  ...   value_key: identity.just_null
  ...   expr: null()
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

Built-in types
--------------

::

  >>> rex = Rex('rex.widget')
  >>> rex.on()

  >>> sorted(FormField.mapped().items()) # doctest: +NORMALIZE_WHITESPACE
  [('bool', rex.widget.formfield.BoolFormField),
   ('calc', rex.widget.formfield.CalcFormField),
   ('date', rex.widget.formfield.DateFormField),
   ('entity', rex.widget.formfield.EntityFormField),
   ('enum', rex.widget.formfield.EnumFormField),
   ('fieldset', rex.widget.formfield.Fieldset),
   ('list', rex.widget.formfield.List),
   ('string', rex.widget.formfield.StringFormField)]

  >>> rex.off()
