*****************
  Map extension
*****************

.. contents:: Table of Contents

Prerequisites
-------------

::

  >>> from webob import Request, Response
  >>> from rex.core import StrVal, BoolVal, RecordVal
  >>> from rex.core import SandboxPackage, Rex
  >>> from rex.urlmap import Map
  >>> from rex.web import PathMask


Basic extensions
----------------

Users can define their own extensions for URL mapping entries::

  >>> class WordRenderer(object):
  ...
  ...   def __init__(self, word):
  ...       self.word = word
  ...
  ...   def __call__(self, req):
  ...       return Response(self.word)

  >>> class MapWord(Map):
  ... 
  ...     fields = [
  ...         ('word', StrVal()),
  ...     ]
  ... 
  ...     def __call__(self, spec, path, context):
  ...         return WordRenderer(spec.word)


  >>> pkg = SandboxPackage()
  >>> pkg.rewrite('/urlmap.yaml', '''
  ... paths:
  ...   /hello:
  ...     word: Hello
  ... ''')

  >>> rex = Rex(pkg, '-', 'rex.urlmap_demo')

  >>> print(Request.blank('/hello').get_response(rex)) # doctest: +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  Hello

Extensions with multiple masks
------------------------------

URL mapping extensions can define multiple masks::

  >>> class GreetingRenderer(object):
  ... 
  ...     def __init__(self, greeting, whom, is_regular):
  ...         self.greeting = greeting
  ...         self.whom = whom
  ...         self.is_regular = is_regular
  ... 
  ...     def __call__(self, req):
  ...         if self.is_regular(req):
  ...             return Response('%s, %s' % (self.greeting, self.whom))
  ...         else:
  ...             return Response('%s, %s!!!' % (self.greeting, self.whom))

  >>> class MapGreeting(Map):
  ... 
  ...     fields = [
  ...        ('greeting', StrVal()),
  ...        ('whom', StrVal()),
  ...     ]
  ... 
  ...     def mask(self, path):
  ...         return [PathMask(path), PathMask('%s/huge' % path)]
  ... 
  ...     def __call__(self, spec, path, context):
  ...         regular, huge = path
  ...         def is_regular(req):
  ...             try:
  ...               regular(req.path_info)
  ...               return True
  ...             except ValueError:
  ...               return False
  ...         return GreetingRenderer(spec.greeting, spec.whom, is_regular)

  >>> pkg = SandboxPackage()
  >>> pkg.rewrite('/urlmap.yaml', '''
  ... paths:
  ...   /hello:
  ...     greeting: Hello
  ...     whom: World
  ... ''')

  >>> rex = Rex(pkg, '-', 'rex.urlmap_demo')

  >>> print(Request.blank('/hello').get_response(rex)) # doctest: +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  Hello, World

  >>> print(Request.blank('/hello/huge').get_response(rex)) # doctest: +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  Hello, World!!!

By default only the main URL can be overriden (the one which equals to the
original path in URL mapping)::

  >>> base_pkg = SandboxPackage('base')
  >>> base_pkg.rewrite('/base.yaml', '''
  ... paths:
  ...   /hello:
  ...     greeting: Hello
  ...     whom: World
  ... ''')

  >>> pkg = SandboxPackage('main')
  >>> pkg.rewrite('/urlmap.yaml', '''
  ... include: base:/base.yaml
  ... paths:
  ...   /hello: !override
  ...     greeting: Hola
  ... ''')

  >>> rex = Rex(pkg, base_pkg, '-', 'rex.urlmap_demo')

  >>> print(Request.blank('/hello').get_response(rex)) # doctest: +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  Hola, World

  >>> print(Request.blank('/hello/huge').get_response(rex)) # doctest: +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  Hola, World!!!

Now if we try to override using the another URL::

  >>> pkg = SandboxPackage('main')
  >>> pkg.rewrite('/urlmap.yaml', '''
  ... include: base:/base.yaml
  ... paths:
  ...   /hello/huge: !override
  ...     greeting: Hola
  ... ''')

  >>> rex = Rex(pkg, base_pkg, '-', 'rex.urlmap_demo') # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Detected invalid override of greeting:
      /hello
  Defined in:
      "...", line 4
  While initializing RexDB application:
      SandboxPackage('main')
      SandboxPackage('base')
      -
      rex.urlmap_demo

Extensions with custom override validator
-----------------------------------------

Extensions can specify validator for overrides::

  >>> class Sentence(Map):
  ... 
  ...   fields = [
  ...       ('sentence', StrVal()),
  ...   ]
  ... 
  ...   validate_override = RecordVal(
  ...     ('important', BoolVal(), None)
  ...   )
  ... 
  ...   def override(self, spec, override_spec):
  ...       if override_spec.important is None:
  ...         return spec
  ...       if override_spec.important:
  ...           return spec.__clone__(sentence=spec.sentence + '!!!')
  ...       elif spec.sentence.endswith('!!!'):
  ...           return spec.__clone__(sentence=spec.sentence[:-3])
  ... 
  ...   def __call__(self, spec, path, context):
  ...       return WordRenderer(spec.sentence)

  >>> base_pkg = SandboxPackage('base')
  >>> base_pkg.rewrite('/base.yaml', '''
  ... paths:
  ...   /hello:
  ...     sentence: Hello, World
  ... ''')

  >>> pkg = SandboxPackage('main')
  >>> pkg.rewrite('/urlmap.yaml', '''
  ... include: base:/base.yaml
  ... paths:
  ...   /hello: !override
  ...     important: true
  ... ''')

  >>> rex = Rex(pkg, base_pkg, '-', 'rex.urlmap_demo')

  >>> print(Request.blank('/hello').get_response(rex)) # doctest: +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  Hello, World!!!

