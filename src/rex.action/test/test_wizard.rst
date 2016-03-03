Wizard
------

::

  >>> import tempfile
  >>> attach_dir = tempfile.mkdtemp(suffix='rex-action-test')

  >>> import json
  >>> from webob import Request
  >>> from rex.core import Rex

::

  >>> from rex.action import setting
  >>> from rex.action.action import Action, Field
  >>> from rex.action.typing import EntityType, RecordType, RecordTypeVal

  >>> class MockAction(Action):
  ...   name = 'mock'
  ...
  ...   input = Field(RecordTypeVal(), default=RecordType.empty())
  ...   output = Field(RecordTypeVal(), default=RecordType.empty())
  ...
  ...   def context(self):
  ...     return self.input, self.output


  >>> class MyAction(Action):
  ...
  ...   name = 'wmy'
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

  >>> rex = Rex('-', 'rex.action_demo', attach_dir=attach_dir)
  >>> rex.on()


::

  >>> from rex.action.wizard import Wizard

  >>> Wizard.parse("""
  ... id: wizard
  ... path:
  ... - first:
  ...   - second:
  ... actions:
  ...   first:
  ...     type: wmy
  ...   second:
  ...     type: wanother
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Wizard(actions={'second': AnotherAction(...),
                  'first': MyAction(...)},
         doc=undefined,
         icon=undefined,
         id='wizard',
         initial_context=None,
         path=Start(then=[Execute(action='first',
                                  then=[Execute(action='second',
                                                then=[],
                                                action_instance=...)],
                    action_instance=...)]),
         states=<Domain default>,
         title=undefined,
         width=undefined)

::

  >>> Wizard.parse("""
  ... id: wizard
  ... path:
  ... - first:
  ... actions:
  ...   first:
  ...     type: wmy
  ...   second:
  ...     type: wanother
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Wizard(actions={'second': AnotherAction(...),
                  'first': MyAction(...)},
         doc=undefined,
         icon=undefined,
         id='wizard',
         initial_context=None,
         path=Start(then=[Execute(action='first', then=[], action_instance=...)]),
         states=<Domain default>,
         title=undefined,
         width=undefined)

::

  >>> w = Wizard.parse("""
  ... id: wizard
  ... path:
  ... - first:
  ... actions:
  ...   first:
  ...     type: wmy
  ... """)

  >>> from rex.widget import encode
  >>> encode(w, Request.blank('/')) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  u'["~#widget", ["rex-action/.../Wizard", ...]]'

::

  >>> Wizard.parse("""
  ... id: wizard
  ... path:
  ... - first:
  ... initial_context:
  ...   x: value
  ... actions:
  ...   first:
  ...     type: require-x
  ... """) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Wizard(actions={'first': RequireX(...)},
         doc=undefined,
         icon=undefined,
         id='wizard',
         initial_context={'x': 'value'},
         path=Start(then=[Execute(action='first', then=[], action_instance=RequireX(...))]),
         states=<Domain default>,
         title=undefined,
         width=undefined)

::

  >>> w = Wizard.parse("""
  ... id: wizard
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

Context refetch::

  >>> w = Wizard.parse("""
  ... id: wizard
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

  >>> refetch = lambda ctx: w.data.respond(Request.blank('/', body=json.dumps(ctx)))

  >>> print refetch({}) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  {}

  >>> print refetch({'x': {'y': '34'}}) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  {"x":{"y":"34"}}

  >>> print refetch({
  ...   'x': {
  ...     'y': {'type': 'individual', 'id': 'C49Z4843'}
  ...   }
  ... }) # doctest: +ELLIPSIS
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  {"x":{"y":null}}

::

  >>> rex.off()

Action resolution
-----------------

::

  >>> from rex.core import Rex, SandboxPackage

  >>> def parse(yaml, other=None):
  ...   package = SandboxPackage()
  ...   other_package = SandboxPackage('other')
  ...   package.rewrite('/urlmap.yaml', yaml)
  ...   if other:
  ...     other_package.rewrite('/urlmap.yaml', other)
  ...   rex = Rex('-', 'rex.action', package, other_package, db='pgsql:action_demo', attach_dir=attach_dir)
  ...   rex.on()
  ...   rex.off()

::

  >>> parse("""
  ... paths:
  ...   /:
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - local-action:
  ...       actions:
  ...         local-action:
  ...           type: mock
  ... """)

  >>> parse("""
  ... paths:
  ...   /:
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - x-local-action:
  ...       actions:
  ...         local-action:
  ...           type: mock
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Found unknown action reference:
      x-local-action
  While parsing:
      "...", line 5
  While initializing RexDB application:
      -
      rex.action
      SandboxPackage()
      SandboxPackage('other')
  With parameters:
      attach_dir: '...'
      db: 'pgsql:action_demo'

  >>> parse("""
  ... paths:
  ...   /action:
  ...     action:
  ...       type: mock
  ...   /:
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - name:
  ...       actions:
  ...         name: /x-action
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Cannot resolve global action reference:
      /x-action
  While parsing:
      "...", line 8
  While initializing RexDB application:
      -
      rex.action
      SandboxPackage()
      SandboxPackage('other')
  With parameters:
      attach_dir: '...'
      db: 'pgsql:action_demo'

  >>> parse("""
  ... paths:
  ...   /action:
  ...     query:
  ...       true()
  ...   /:
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - name:
  ...       actions:
  ...         name: /action
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action reference resolves to handler of a non-action type:
      /action
  While parsing:
      "...", line 8
  While initializing RexDB application:
      -
      rex.action
      SandboxPackage()
      SandboxPackage('other')
  With parameters:
      attach_dir: '...'
      db: 'pgsql:action_demo'

  >>> parse("""
  ... paths:
  ...   /:
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - other-action:
  ...       actions:
  ...         other-action: other:/action
  ... """, """
  ... paths:
  ...   /action:
  ...     action:
  ...       type: mock
  ... """) # doctest: +ELLIPSIS

  >>> parse("""
  ... paths:
  ...   /:
  ...     action:
  ...       type: wizard
  ...       path:
  ...       - other-action:
  ...       actions:
  ...         other-action: other:/action
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Cannot resolve global action reference:
      other:/action
  While parsing:
      "...", line 5
  While initializing RexDB application:
      -
      rex.action
      SandboxPackage()
      SandboxPackage('other')
  With parameters:
      attach_dir: '...'
      db: 'pgsql:action_demo'

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
  ... id: wizard
  ... path:
  ... - pick-individual:
  ... actions:
  ...   pick-individual:
  ...     type: mock
  ...     output:
  ...     - individual: individual
  ... """)

  >>> typecheck("""
  ... id: wizard
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
  Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      <empty context>
  While type checking action at path:
      view-individual
  While parsing:
      "<...>", line 4

  >>> typecheck("""
  ... id: wizard
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
  Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      <empty context>
  While type checking action at path:
      view-individual
  While parsing:
      "<...>", line 5

  >>> typecheck("""
  ... id: wizard
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
  ... id: wizard
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
  ... id: wizard
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
  Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      <empty context>
  While type checking action at path:
      home -> view-individual
  While parsing:
      "<...>", line 5

  >>> typecheck("""
  ... id: wizard
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
  ... id: wizard
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
  Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      study: study
  While type checking action at path:
      pick-study -> view-individual
  While parsing:
      "<...>", line 5

Keys aren't same as types, fail::

  >>> typecheck("""
  ... id: wizard
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
  Error: Action "view-individual" cannot be used here:
      Context is missing "individual: individual"
  Context:
      mother: individual
  While type checking action at path:
      pick-mother -> view-individual
  While parsing:
      "<...>", line 5

Keys aren't same as types, still match::

  >>> typecheck("""
  ... id: wizard
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
  ... id: wizard
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
  Error: Action "view-mother" cannot be used here:
      Context is missing "mother: individual"
  Context:
      individual: individual
  While type checking action at path:
      pick-individual -> view-mother
  While parsing:
      "<...>", line 5

  >>> typecheck("""
  ... id: wizard
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
  Error: Action "view-mother-study" cannot be used here:
      Context has "mother: individual" but expected to have "mother: study"
  Context:
      mother: individual
  While type checking action at path:
      pick-mother -> view-mother-study
  While parsing:
      "<...>", line 5

Indexed types
~~~~~~~~~~~~~

Same key, same entity, has any state, require recruited state, fail::

  >>> typecheck("""
  ... id: wizard
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
  ... id: wizard
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
  ... id: wizard
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
  ... id: wizard
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
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Action "view-recruited-individual" cannot be used here:
      Context has "individual: individual[enrolled]" but expected to have "individual: individual[recruited]"
  Context:
      individual: individual[enrolled]
  While type checking action at path:
      pick-enrolled-individual -> view-recruited-individual
  While parsing:
      "<...>", line 5

Repeat
~~~~~~

::

  >>> typecheck("""
  ... id: wizard
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
  ... id: wizard
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
  Error: Action "view-mother" cannot be used here:
      Context is missing "mother: individual"
  Context:
      individual: individual
  While type checking action at path:
      <repeat loop> -> pick-individual -> view-mother
  While parsing:
      "<...>", line 6

  >>> typecheck("""
  ... id: wizard
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
  ... id: wizard
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
  Error: Action "view-mother" cannot be used here:
      Context is missing "mother: individual"
  Context:
      individual: individual
  While type checking action at path:
      <repeat then> -> pick-individual -> view-mother
  While parsing:
      "<...>", line 9

  >>> typecheck("""
  ... id: wizard
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
  Error: Repeat ends with a type which is incompatible with its beginning:
      Has "individual: study" but expected to have "individual: individual"
  While parsing:
      "<...>", line 7

Replace
~~~~~~~

::

  >>> typecheck("""
  ... id: wizard
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
  ... id: wizard
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
  ... id: wizard
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
  Error: Action "view-lab" cannot be used here:
      Context is missing "lab: lab"
  Context:
      individual: individual
  While type checking action at path:
      make-individual -> <replace ../pick-lab/view-lab> -> view-lab
  While parsing:
      "<...>", line 5

::

  >>> rex.off()
