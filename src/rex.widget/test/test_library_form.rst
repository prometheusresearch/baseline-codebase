Tests forms library
===================

::

    >>> from pprint import pprint

Hack::

    >>> import rex.ctl

Initialize the Rex application::

    >>> from rex.core import Rex
    >>> app = Rex('rex.widget_demo')
    >>> app.on()


    >>> from rex.widget import parse

Define form
-----------

We define the form using the form widgets ``<Form />``, ``<Fieldset />`` 
and ``<Field />``::

    >>> form = parse("""
    ... !<Form>
    ... id: form
    ... fieldset:
    ... - !<Field>
    ...   value_key: aa
    ... - !<Fieldset>
    ...   value_key: bb
    ...   fieldset:
    ...   - !<Field>
    ...     value_key: aa
    ...   - !<Field>
    ...     value_key: bb
    ... - !<Field>
    ...   value_key: cc.aa
    ... - !<Field>
    ...   value_key: cc.bb
    ... """)

    >>> pprint(form.form_schema()) # doctest: +NORMALIZE_WHITESPACE
    <MappingNode {'children':
      OrderedDict([('aa', <ScalarNode {'hint': None, 'required': False, 'label': None}>),
                   ('bb', <MappingNode {'children':
                      OrderedDict([('aa', <ScalarNode {'hint': None, 'required': False, 'label': None}>),
                                   ('bb', <ScalarNode {'hint': None, 'required': False, 'label': None}>)])}>),
                   ('cc', <MappingNode {'children':
                      OrderedDict([('aa', <ScalarNode {'hint': None, 'required': False, 'label': None}>),
                                   ('bb', <ScalarNode {'hint': None, 'required': False, 'label': None}>)])}>)])}>

Mix form widget and regular widgets
-----------------------------------

We can mix regular widgets and form widgets within the form::

    >>> form = parse("""
    ... !<Form>
    ... id: form
    ... fieldset: !<Container>
    ...   children:
    ...   - !<Block>
    ...     children:
    ...     - !<Field>
    ...       value_key: aa
    ...   - !<Block>
    ...     children: !<Fieldset>
    ...       value_key: bb
    ...       fieldset:
    ...       - !<Field>
    ...         value_key: aa
    ...       - !<Field>
    ...         value_key: bb
    ...   - !<Block>
    ...     children:
    ...     - !<Field>
    ...       value_key: cc.aa
    ...     - !<Field>
    ...       value_key: cc.bb
    ... """)

The form schema will be correctly inferred:: 

    >>> pprint(form.form_schema()) # doctest: +NORMALIZE_WHITESPACE
    <MappingNode {'children':
      OrderedDict([('aa', <ScalarNode {'hint': None, 'required': False, 'label': None}>),
                   ('bb', <MappingNode {'children':
                     OrderedDict([('aa', <ScalarNode {'hint': None, 'required': False, 'label': None}>),
                                  ('bb', <ScalarNode {'hint': None, 'required': False, 'label': None}>)])}>),
                   ('cc', <MappingNode {'children':
                     OrderedDict([('aa', <ScalarNode {'hint': None, 'required': False, 'label': None}>),
                                  ('bb', <ScalarNode {'hint': None, 'required': False, 'label': None}>)])}>)])}>

    >>> form = parse("""
    ... !<Form>
    ... id: form
    ... fieldset: !<Container>
    ...   children:
    ...   - !<Block>
    ...     children:
    ...     - !<Field>
    ...       value_key: identity.givenname
    ...     - !<Field>
    ...       value_key: sex
    ...   - !<Block>
    ...     children:
    ...     - !<Field>
    ...       value_key: identity.surname
    ...     - !<Field>
    ...       value_key: identity.birthdate
    ... """)

    >>> pprint(form.form_schema()) # doctest: +NORMALIZE_WHITESPACE
    <MappingNode {'children':
      OrderedDict([('sex', <ScalarNode {'hint': None, 'required': False, 'label': None}>),
                   ('identity', <MappingNode {'children':
                     OrderedDict([('givenname', <ScalarNode {'hint': None, 'required': False, 'label': None}>),
                                  ('surname', <ScalarNode {'hint': None, 'required': False, 'label': None}>),
                                  ('birthdate', <ScalarNode {'hint': None, 'required': False, 'label': None}>)])}>)])}>

::

    >>> app.off()
