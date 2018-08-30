Test 'entity' formfield
=======================

Prerequisite
------------

::

  >>> from webob import Request
  >>> from rex.core import Rex
  >>> from rex.widget import FormFieldVal

  >>> rex = Rex('rex.widget_demo')
  >>> rex.on()

  >>> v = FormFieldVal()

Configuring through YAML
------------------------

Field configured to use autocomplete::

  >>> field = v.parse("""
  ... type: entity
  ... value_key: individual
  ... data:
  ...   entity: individual
  ...   title: identity.givenname
  ... """)

  >>> field # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  EntityFormField(value_key=['individual'],
                  widget=AutocompleteField(...),
                  data=Record(entity='individual',
                              title=u'identity.givenname',
                              select=[],
                              mask=None))

  >>> widget = field.widget()

  >>> widget.query_port
  Port('''
  entity: individual
  select: []
  with:
  - calculation: title
    expression: identity.givenname
  ''')

  >>> widget.title_port
  Port('''
  entity: individual
  select: []
  with:
  - calculation: title
    expression: identity.givenname
  ''')

Field configured to use radio button group::

  >>> field = v.parse("""
  ... type: entity
  ... value_key: individual
  ... using: radio-group
  ... data:
  ...   entity: individual
  ...   title: identity.givenname
  ... """)

  >>> field # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  EntityFormField(value_key=['individual'],
                  widget=RadioGroupField(...),
                  data=Record(entity='individual',
                              title=u'identity.givenname',
                              select=[],
                              mask=None),
                  using='radio-group')

  >>> widget = field.widget()

  >>> widget.options # doctest: +ELLIPSIS
  <rex.widget.field.Responder object at ...>

  >>> print(widget.options.respond(
  ...   Request.blank('/', accept='application/json'))) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/javascript
  Content-Disposition: inline; filename="_.js"
  Vary: Accept
  Content-Length: ...
  <BLANKLINE>
  {
    "individual": ...
  }
  <BLANKLINE>

Cleanup
-------

::

  >>> rex.off()

