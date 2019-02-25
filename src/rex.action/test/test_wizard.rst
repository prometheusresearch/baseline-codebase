Wizard
------

::

  >>> db = 'pgsql:action_demo'

  >>> import tempfile
  >>> attach_dir = tempfile.mkdtemp(suffix='rex-action-test')

  >>> import json
  >>> from webob import Request
  >>> from rex.core import Rex, StrVal
  >>> from rex.widget import undefined

::

  >>> from rex.action import setting
  >>> from rex.action.validate import ActionVal
  >>> from rex.action.action import Action, Field
  >>> from rex.action.typing import EntityType, RecordType, RecordTypeVal

  >>> class MockAction(Action):
  ...   name = 'mock'
  ... 
  ...   text = Field(StrVal(), default=undefined)
  ...   input = Field(RecordTypeVal(), default=RecordType.empty())
  ...   output = Field(RecordTypeVal(), default=RecordType.empty())
  ... 
  ...   def context(self):
  ...     return self.input, self.output


  >>> class MyAction(Action):
  ... 
  ...   name = 'wmy'
  ...   js_type = 'pkg', 'MyAction'
  ... 
  ...   def context(self):
  ...     return self.domain.record(), self.domain.record()

  >>> class AnotherAction(Action):
  ... 
  ...   name = 'wanother'
  ... 
  ...   def context(self):
  ...     return self.domain.record(), self.domain.record()

  >>> class RequireX(Action):
  ... 
  ...   name = 'require-x'
  ... 
  ...   def context(self):
  ...     return self.domain.record(x='x'), self.domain.record()

  >>> class ProvideX(Action):
  ... 
  ...   name = 'provide-x'
  ... 
  ...   def context(self):
  ...     return self.domain.record(), self.domain.record(x='x')

  >>> rex = Rex('-', 'rex.action_demo', db=db, attach_dir=attach_dir)
  >>> rex.on()


::

  >>> from rex.action.wizard import Wizard

  >>> def parse(yaml):
  ...   return ActionVal().parse(yaml)

  >>> parse("""
  ... type: wizard
  ... path:
  ... - first:
  ...   - second:
  ... actions:
  ...   first:
  ...     type: wmy
  ...   second:
  ...     type: wanother
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Wizard(...)

::

  >>> parse("""
  ... type: wizard
  ... path:
  ... - first:
  ... actions:
  ...   first:
  ...     type: wmy
  ...   second:
  ...     type: wanother
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Wizard(...)

::

  >>> w = parse("""
  ... type: wizard
  ... path:
  ... - first:
  ... actions:
  ...   first:
  ...     type: wmy
  ... """)

  >>> from rex.widget import encode
  >>> encode(w, Request.blank('/')) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  '["~#widget", ["@js-package::rex-action", "Wizard", ...]]'

::

  >>> parse("""
  ... type: wizard
  ... path:
  ... - first:
  ... initial_context:
  ...   x: value
  ... actions:
  ...   first:
  ...     type: require-x
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Wizard(...)

::

  >>> w = parse("""
  ... type: wizard
  ... path:
  ... - first:
  ...   - second:
  ... actions:
  ...   first:
  ...     type: wmy
  ...   second:
  ...     type: wanother
  ... states:
  ...   individual:
  ...     recruited:
  ...       title: Recruited individuals
  ...       expression: exists(study_enrollment.individual = id())
  ... """) # doctest: +NORMALIZE_WHITESPACE

  >>> w.states
  <Domain action-scoped>

  >>> w.states['individual[recruited]'] # doctest: +NORMALIZE_WHITESPACE
  EntityType(name='individual',
             state=EntityTypeState(name='recruited',
                                   title='Recruited individuals',
                                   expression='exists(study_enrollment.individual = id())',                                    input=None))

Multiple actions dicts::

  >>> w = parse("""
  ... type: wizard
  ... path:
  ... - first:
  ...   - second:
  ... actions:
  ...   first:
  ...     type: wmy
  ...   second:
  ...     type: wanother
  ... """)

  >>> w.path
  Start(then=[Execute(id='first', action='first', then=[Execute(id='second', action='second', then=[], action_instance=AnotherAction(...))], action_instance=MyAction(...))])

  >>> w.actions
  {'first': MyAction(...), 'second': AnotherAction(...)}

  >>> w = parse("""
  ... type: wizard
  ... path:
  ... - first:
  ...   - second:
  ... actions:
  ...   - first:
  ...       type: wmy
  ...   - second:
  ...       type: wanother
  ... """)

  >>> w.path
  Start(then=[Execute(id='first', action='first', then=[Execute(id='second', action='second', then=[], action_instance=AnotherAction(...))], action_instance=MyAction(...))])

  >>> w.actions
  {'first': MyAction(...), 'second': AnotherAction(...)}

  >>> w = parse("""
  ... type: wizard
  ... path:
  ... - first:
  ...   - second:
  ... actions:
  ...   - first:
  ...       type: wmy
  ...   - second:
  ...       type: wanother
  ... states:
  ...   individual:
  ...     recruited:
  ...       title: Recruited individuals
  ...       expression: true()
  ... """)

  >>> w.states.entity_types
  {'individual[recruited]': EntityType(name='individual', state=EntityTypeState(name='recruited', title='Recruited individuals', expression='true()', input=None))}

  >>> w = parse("""
  ... type: wizard
  ... path:
  ... - first:
  ...   - second:
  ... actions:
  ...   - first:
  ...       type: wmy
  ...   - second:
  ...       type: wanother
  ... states:
  ... - individual:
  ...     recruited:
  ...       title: Recruited individuals
  ...       expression: true()
  ... - individual:
  ...     not-recruited:
  ...       title: Not Recruited individuals
  ...       expression: false()
  ... """)

  >>> w.states.entity_types
  {'individual[recruited]': EntityType(name='individual', state=EntityTypeState(name='recruited', title='Recruited individuals', expression='true()', input=None)), 'individual[not-recruited]': EntityType(name='individual', state=EntityTypeState(name='not-recruited', title='Not Recruited individuals', expression='false()', input=None))}

Context refetch::

  >>> w = parse("""
  ... type: wizard
  ... path:
  ... - first:
  ...   - second:
  ... actions:
  ...   first:
  ...     type: wmy
  ...   second:
  ...     type: wanother
  ... states:
  ...   individual:
  ...     recruited:
  ...       title: Recruited individuals
  ...       expression: exists(study_enrollment.individual = id())
  ... """)

  >>> refetch = lambda ctx: w.data.respond(
  ...   Request.blank('/', method='POST', json=ctx))

  >>> print(refetch({})) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  {}

  >>> print(refetch({'x': {'y': '34'}})) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  {"x":{"y":"34"}}

  >>> print(refetch({
  ...   'x': {
  ...     'y': {'type': 'individual', 'id': 'C49Z4843'}
  ...   }
  ... })) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  {"x":{"y":null}}

::

  >>> rex.off()

Typechecking
------------

::

  >>> from rex.core import Rex
  >>> rex = Rex('-')
  >>> rex.on()

::

  >>> def typecheck(yaml):
  ...   wizard = Wizard.parse(yaml)
  ...   wizard.typecheck(context_type=RecordType.empty())

Basic cases
~~~~~~~~~~~

  >>> typecheck("""
  ... path:
  ... - pick-individual:
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ... """)

  >>> typecheck("""
  ... path:
  ... - view-individual:
  ... actions:
  ...   view-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      <empty context>
  While type checking action at path:
      view-individual
  While parsing:
      "<...>", line 3

  >>> typecheck("""
  ... path:
  ... - pick-individual:
  ... - view-individual:
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ...   view-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      <empty context>
  While type checking action at path:
      view-individual
  While parsing:
      "<...>", line 4

  >>> typecheck("""
  ... path:
  ... - pick-individual:
  ...   - pick-individual:
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ... """) # doctest: +ELLIPSIS

  >>> typecheck("""
  ... path:
  ... - pick-individual:
  ...   - view-individual:
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ...   view-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual
  ... """) # doctest: +ELLIPSIS

  >>> typecheck("""
  ... path:
  ... - home:
  ...   - view-individual:
  ... actions:
  ...   home:
  ...     type: mock
  ...   view-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      <empty context>
  While type checking action at path:
      home -> view-individual
  While parsing:
      "<...>", line 4

  >>> typecheck("""
  ... path:
  ... - pick-individual:
  ...   - home:
  ... actions:
  ...   home:
  ...     type: mock
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ... """) # doctest: +ELLIPSIS

Basic cases, different keys
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Keys and types are different, fail::

  >>> typecheck("""
  ... path:
  ... - pick-study:
  ...   - view-individual:
  ... actions:
  ...   view-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual
  ...   pick-study:
  ...     type: mock
  ...     output:
  ...     - study: study 
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      study: study
  While type checking action at path:
      pick-study -> view-individual
  While parsing:
      "<...>", line 4

Keys aren't same as types, fail::

  >>> typecheck("""
  ... path:
  ... - pick-mother:
  ...   - view-individual:
  ... actions:
  ...   pick-mother:
  ...     type: mock
  ...     output:
  ...     - mother: individual
  ...   view-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      mother: individual
  While type checking action at path:
      pick-mother -> view-individual
  While parsing:
      "<...>", line 4

Keys aren't same as types, still match::

  >>> typecheck("""
  ... path:
  ... - pick-mother:
  ...   - view-mother:
  ... actions:
  ...   pick-mother:
  ...     type: mock
  ...     output:
  ...     - mother: individual
  ...   view-mother:
  ...     type: mock
  ...     input:
  ...     - mother: individual
  ... """) # doctest: +NORMALIZE_WHITESPACE

Same type, different key, fail::

  >>> typecheck("""
  ... path:
  ... - pick-individual:
  ...   - view-mother:
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ...   view-mother:
  ...     type: mock
  ...     input:
  ...     - mother: individual
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Action "view-mother" cannot be used here:
      Context is missing "mother: individual"
  Context:
      individual: individual
  While type checking action at path:
      pick-individual -> view-mother
  While parsing:
      "<...>", line 4

  >>> typecheck("""
  ... path:
  ... - pick-mother:
  ...   - view-mother-study:
  ... actions:
  ...   pick-mother:
  ...     type: mock
  ...     output:
  ...     - mother: individual
  ...   view-mother-study:
  ...     type: mock
  ...     input:
  ...     - mother: study 
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Action "view-mother-study" cannot be used here:
      Context has "mother: individual" but expected to have "mother: study"
  Context:
      mother: individual
  While type checking action at path:
      pick-mother -> view-mother-study
  While parsing:
      "<...>", line 4


Indexed types
~~~~~~~~~~~~~

Same key, same entity, has any state, require recruited state, fail::

  >>> typecheck("""
  ... path:
  ... - pick-individual:
  ...   - view-recruited-individual:
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ...   view-recruited-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual[recruited]
  ... states:
  ...   individual:
  ...     recruited:
  ...       title: Recruited
  ...       expression: true()
  ... """) # doctest: +NORMALIZE_WHITESPACE

Same key, same entity, has recruited, require any state, success::

  >>> typecheck("""
  ... path:
  ... - pick-recruited-individual:
  ...   - view-individual:
  ... actions:
  ...   pick-recruited-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual[recruited]
  ...   view-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual
  ... states:
  ...   individual:
  ...     recruited:
  ...       title: Recruited
  ...       expression: true()
  ... """) # doctest: +NORMALIZE_WHITESPACE

Same key, same entity, has recruited, require recruited, success::

  >>> typecheck("""
  ... path:
  ... - pick-recruited-individual:
  ...   - view-recruited-individual:
  ... actions:
  ...   pick-recruited-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual[recruited]
  ...   view-recruited-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual[recruited]
  ... states:
  ...   individual:
  ...     recruited:
  ...       title: Recruited
  ...       expression: true()
  ... """) # doctest: +NORMALIZE_WHITESPACE

Same key, same entity, has enrolled, require recruited, fail::

  >>> typecheck("""
  ... path:
  ... - pick-enrolled-individual:
  ...   - view-recruited-individual:
  ... actions:
  ...   pick-enrolled-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual[enrolled]
  ...   view-recruited-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual[recruited]
  ... states:
  ...   individual:
  ...     recruited:
  ...       title: Recruited
  ...       expression: true()
  ...     enrolled:
  ...       title: Recruited
  ...       expression: true()
  ... """)

Repeat
~~~~~~

::

  >>> typecheck("""
  ... path:
  ... - repeat:
  ...   - pick-individual:
  ...     - view-individual:
  ...   then:
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ...   view-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual
  ... """) # doctest: +NORMALIZE_WHITESPACE

  >>> typecheck("""
  ... path:
  ... - repeat:
  ...   - pick-individual:
  ...     - view-mother:
  ...   then:
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ...   view-mother:
  ...     type: mock
  ...     input:
  ...     - mother: individual
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Action "view-mother" cannot be used here:
      Context is missing "mother: individual"
  Context:
      individual: individual
  While type checking action at path:
      <repeat loop> -> pick-individual -> view-mother
  While parsing:
      "<...>", line 5

  >>> typecheck("""
  ... path:
  ... - repeat:
  ...   - pick-individual:
  ...     - view-individual:
  ...   then:
  ...   - pick-individual:
  ...     - view-individual:
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ...   view-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual
  ... """) # doctest: +NORMALIZE_WHITESPACE

  >>> typecheck("""
  ... path:
  ... - repeat:
  ...   - pick-individual:
  ...     - view-individual:
  ...   then:
  ...   - pick-individual:
  ...     - view-mother:
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ...   view-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual
  ...   view-mother:
  ...     type: mock
  ...     input:
  ...     - mother: individual
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Action "view-mother" cannot be used here:
      Context is missing "mother: individual"
  Context:
      individual: individual
  While type checking action at path:
      <repeat then> -> pick-individual -> view-mother
  While parsing:
      "<...>", line 8

  >>> typecheck("""
  ... path:
  ... - pick-individual:
  ...   - repeat:
  ...     - view-individual:
  ...       - pick-study-as-individual:
  ...     then:
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ...   view-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual
  ...   pick-study-as-individual:
  ...     type: mock
  ...     output:
  ...     - individual: study
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Repeat ends with a type which is incompatible with its beginning:
      Has "individual: study" but expected to have "individual: individual"
  While parsing:
      "<...>", line 6

Replace
~~~~~~~

::

  >>> typecheck("""
  ... path:
  ... - pick-individual:
  ... - make-individual:
  ...   - replace: ../pick-individual
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ...   make-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ... """) # doctest: +ELLIPSIS

  >>> typecheck("""
  ... path:
  ... - pick-individual:
  ...   - view-individual:
  ... - make-individual:
  ...   - replace: ../pick-individual/view-individual
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ...   view-individual:
  ...     type: mock
  ...     input:
  ...     - individual: individual
  ...   make-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ... """) # doctest: +ELLIPSIS

  >>> typecheck("""
  ... path:
  ... - pick-lab:
  ...   - view-lab:
  ... - make-individual:
  ...   - replace: ../pick-lab/view-lab
  ... actions:
  ...   pick-lab:
  ...     type: mock
  ...     output:
  ...     - lab: lab
  ...   view-lab:
  ...     type: mock
  ...     input:
  ...     - lab: lab
  ...   make-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Action "view-lab" cannot be used here:
      Context is missing "lab: lab"
  Context:
      individual: individual
  While type checking action at path:
      make-individual -> <replace ../pick-lab/view-lab> -> pick-lab -> view-lab
  While parsing:
      "<...>", line 4

::

  >>> rex.off()

Overrides
---------

::

  >>> rex = Rex('-', 'rex.action_demo', db=db, attach_dir=attach_dir)
  >>> rex.on()

::

  >>> w = Action.parse("""
  ... type:
  ...   type: wizard
  ...   path:
  ...   - pick-individual:
  ...   actions:
  ...     pick-individual:
  ...       type: mock
  ...       text: NOTOK
  ...       output:
  ...       - individual: individual
  ... pick-individual:
  ...   type: mock
  ...   text: OK
  ... """)

::

  >>> w.actions['pick-individual'].text # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  'OK'

  >>> w = Action.parse("""
  ... type:
  ...   type: wizard
  ...   path:
  ...   - pick-individual:
  ...   actions:
  ...     pick-individual:
  ...       type: mock
  ...       text: NOTOK
  ...       output:
  ...       - individual: individual
  ... pick-individual:
  ...   text: OK
  ... """)

  >>> w.actions['pick-individual'].text
  'OK'

::

  >>> rex.off()

