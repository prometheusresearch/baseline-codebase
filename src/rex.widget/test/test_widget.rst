
Widget
======

::

  >>> from webob import Request, Response

  >>> from rex.core import Rex, StrVal, IntVal

  >>> from rex.widget import Widget, WidgetVal, encode, render_widget
  >>> from rex.widget import Field, computed_field, WidgetVal

Init
----

::

  >>> class MyWidget(Widget):
  ... 
  ...   name = 'MyWidget'
  ...   js_type = 'rex-widget', 'MyWidget'
  ... 
  ...   title = Field(StrVal())
  ... 
  ...   desc = Field(StrVal(), default='no desc')
  ... 
  ...   @computed_field
  ...   def computed(self, req):
  ...     return 'computed!'

  >>> rex = Rex('-', 'rex.widget_demo')
  >>> rex.on()

Widget
------

::

  >>> MyWidget in Widget.all()
  True

  >>> Widget.mapped().get('MyWidget') is MyWidget
  True

  >>> MyWidget.title
  <Field title>

  >>> MyWidget.computed
  <ComputedField computed>

  >>> MyWidget._fields # doctest: +NORMALIZE_WHITESPACE
  OrderedDict([('desc', <Field desc>),
               ('title', <Field title>),
               ('computed', <ComputedField computed>)])

  >>> MyWidget() # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Missing mandatory field:
      title
  Of widget:
      MyWidget

  >>> MyWidget(title=42) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Expected a string
  Got:
      42
  While validating field:
      title
  Of widget:
      MyWidget

  >>> w = MyWidget(title='Ok')
  >>> w
  MyWidget(...)

  >>> w.title
  'Ok'

  >>> req = Request.blank('/')
  >>> encode(w, req)
  '["~#widget", ["@js-package::rex-widget", "MyWidget", {"title": "Ok", "desc": "no desc", "computed": "computed!"}]]'

  >>> w.__clone__(title='notok')
  MyWidget(...)

  >>> MyWidget.parse("""
  ... title: OK
  ... """)
  MyWidget(...)

  >>> MyWidget.parse("""
  ... !<MyWidget>
  ... title: OK
  ... """)
  MyWidget(...)

  >>> MyWidget.parse("""
  ... !<MyWidget> OK
  ... """)
  MyWidget(...)

Widget can only be parsed from stream or a string repr::

  >>> MyWidget.parse({'title': 'OK'}) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Cannot parse a widget from:
      {'title': 'OK'}


Widget with non-transitionable field
------------------------------------

::
  
  >>> rex.cache.clear()

  >>> class WidgetWithNonTransitionableField(Widget):
  ... 
  ...   name = 'WidgetWithNonTransitionableField'
  ...   js_type = 'rex-widget', 'WidgetWithNonTransitionableField'
  ... 
  ...   title = Field(StrVal())
  ... 
  ...   db = Field(StrVal(), transitionable=False)

  >>> w = WidgetWithNonTransitionableField(title='Title', db='db!')

  >>> w
  WidgetWithNonTransitionableField(...)

  >>> req = Request.blank('/')
  >>> encode(w, req)
  '["~#widget", ["@js-package::rex-widget", "WidgetWithNonTransitionableField", {"title": "Title"}]]'

Null widget
-----------

::

  >>> from rex.widget import NullWidget
  >>> w = NullWidget()
  >>> w
  NullWidget(...)

  >>> req = Request.blank('/')
  >>> encode(w, req)
  '["~#\'", null]'

Group widget
------------

::

  >>> from rex.widget import GroupWidget
  >>> w = GroupWidget(children=[NullWidget()])
  >>> w
  GroupWidget(...)

  >>> req = Request.blank('/')
  >>> encode(w, req)
  '[null]'


Nested widget hierarchy
-----------------------

::

  >>> rex.cache.clear()

  >>> class ComplexWidget(Widget):
  ...   name = 'ComplexWidget'
  ...   js_type = 'pkg', 'ComplexWidget'
  ...   children = Field(WidgetVal())

  >>> w = ComplexWidget(children=MyWidget(title='title'))

  >>> w
  ComplexWidget(...)

  >>> req = Request.blank('/')
  >>> encode(w, req) # doctest: +NORMALIZE_WHITESPACE
  '["~#widget", ["@js-package::pkg", "ComplexWidget",
                  {"children": ["^0", ["@js-package::rex-widget", "MyWidget",
                                       {"desc": "no desc", "title": "title", "computed": "computed!"}]]}]]'

  >>> w = ComplexWidget(children=[MyWidget(title='title')])

  >>> w
  ComplexWidget(...)

  >>> req = Request.blank('/')
  >>> encode(w, req) # doctest: +NORMALIZE_WHITESPACE
  '["~#widget", ["@js-package::pkg", "ComplexWidget",
                  {"children": [["^0", ["@js-package::rex-widget", "MyWidget",
                                        {"desc": "no desc", "title": "title", "computed": "computed!"}]]]}]]'

Widget composition
------------------

::

  >>> from rex.widget import WidgetComposition

  >>> rex.cache.clear()

  >>> class MyWidgetComposition(WidgetComposition):
  ... 
  ...   title = Field(StrVal())
  ... 
  ...   def render(self):
  ...     return MyWidget(title=self.title + '!')

  >>> w = MyWidgetComposition(title='ok')

  >>> w
  MyWidgetComposition(...)

  >>> w = MyWidgetComposition.parse("""
  ... !<MyWidgetComposition>
  ... title: ok
  ... """)

  >>> w
  MyWidgetComposition(...)

  >>> req = Request.blank('/')
  >>> encode(w, req) # doctest: +NORMALIZE_WHITESPACE
  '["~#widget", ["@js-package::rex-widget", "MyWidget", {"title": "ok!", "desc": "no desc", "computed": "computed!"}]]'

  >>> rex.cache.clear()

  >>> class MyWidgetCompositionError(WidgetComposition):
  ...
  ...   title = Field(IntVal())
  ...
  ...   def render(self):
  ...     return MyWidget(title=self.title)


  >>> MyWidgetCompositionError(title=42) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Expected a string
  Got:
      42
  While validating field:
      title
  Of widget:
      MyWidget

  >>> MyWidgetCompositionError.parse("""
  ... !<MyWidgetCompositionError>
  ... title: 42
  ... """) # doctest: +ELLIPSIS
  Traceback (most recent call last):
  ...
  rex.core.Error: Expected a string
  Got:
      42
  While validating field:
      title
  Of widget:
      MyWidget
  While parsing:
      "<...>", line 2

Raw widgets
-----------

::

  >>> from rex.widget import raw_widget

  >>> encode(raw_widget(('pkg', 'type'), {'key': 'value'}), Request.blank('/'))
  '["~#widget", ["@js-package::pkg", "type", {"key": "value"}]]'

  >>> encode(raw_widget(('pkg', 'type'), key='value'), Request.blank('/'))
  '["~#widget", ["@js-package::pkg", "type", {"key": "value"}]]'

  >>> encode(raw_widget(('pkg', 'type'), {'a': 'b'}, key='value'), Request.blank('/'))
  '["~#widget", ["@js-package::pkg", "type", {"a": "b", "key": "value"}]]'

Widget pointer
--------------

::

  >>> from rex.widget.pointer import Pointer

  >>> class WidgetWithPointer(Widget):
  ...   name = 'WidgetWithPointer'
  ...   js_type = 'pkg', 'WidgetWithPointer'
  ... 
  ...   @computed_field
  ...   def pointer(self):
  ...     return Pointer(self)
  ... 
  ...   def respond(self, req):
  ...     return Response('ok')

  >>> w = WidgetWithPointer()

  >>> print(render_widget(w, Request.blank('/', accept='application/json'))) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["@js-package::rex-widget", "Chrome", {"content": ["^0", ["@js-package::pkg", "WidgetWithPointer", {"pointer": ["~#url", ["http://localhost/@@/2.content"]]}]], "title": null}]]

  >>> print(render_widget(
  ...   w,
  ...   Request.blank('/@@/2.content', accept='application/json'),
  ...   path='2.content',
  ... )) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ok

  >>> w = ComplexWidget(children=WidgetWithPointer())

  >>> print(render_widget(w, Request.blank('/', accept='application/json'))) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["@js-package::rex-widget", "Chrome", {"content": ["^0", ["@js-package::pkg", "ComplexWidget", {"children": ["^0", ["@js-package::pkg", "WidgetWithPointer", {"pointer": ["~#url", ["http://localhost/@@/2.content.2.children"]]}]]}]], "title": null}]]

  >>> print(render_widget(
  ...   w,
  ...   Request.blank('/@@/2.content.2.children', accept='application/json'),
  ...   path='2.content.2.children',
  ... )) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ok

  >>> w = ComplexWidget(children=[WidgetWithPointer()])

  >>> print(render_widget(w, Request.blank('/', accept='application/json'))) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["@js-package::rex-widget", "Chrome", {"content": ["^0", ["@js-package::pkg", "ComplexWidget", {"children": [["^0", ["@js-package::pkg", "WidgetWithPointer", {"pointer": ["~#url", ["http://localhost/@@/2.content.2.children.0"]]}]]]}]], "title": null}]]

  >>> print(render_widget(
  ...   w,
  ...   Request.blank('/@@/2.content.2.children.0', accept='application/json'),
  ...   path='2.content.2.children.0',
  ... )) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ok

Pointer to field::

  >>> class WidgetWithFieldPointer(Widget):
  ...   name = 'WidgetWithFieldPointer'
  ...   js_type = 'pkg', 'WidgetWithFieldPointer'
  ... 
  ...   @computed_field
  ...   def pointer(self):
  ...     return Pointer(self, to_field=True)

  >>> w = WidgetWithFieldPointer()

  >>> print(render_widget(w, Request.blank('/', accept='application/json'))) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["@js-package::rex-widget", "Chrome", {"content": ["^0", ["@js-package::pkg", "WidgetWithFieldPointer", {"pointer": ["~#url", ["http://localhost/@@/2.content.2.pointer"]]}]], "title": null}]]

Pointer with wrapper::

  >>> class WidgetWithWrappedPointer(Widget):
  ...   name = 'WidgetWithWrappedPointer'
  ...   js_type = 'pkg', 'WidgetWithWrappedPointer'
  ... 
  ...   @computed_field
  ...   def pointer(self):
  ...     return Pointer(self, to_field=True, wrap=self.wrap)
  ... 
  ...   def wrap(self, widget, url):
  ...     return [url]

  >>> w = WidgetWithWrappedPointer()

  >>> print(render_widget(w, Request.blank('/', accept='application/json'))) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["@js-package::rex-widget", "Chrome", {"content": ["^0", ["@js-package::pkg", "WidgetWithWrappedPointer", {"pointer": [["~#url", ["http://localhost/@@/2.content.2.pointer"]]]}]], "title": null}]]


Responder field
---------------

::

  >>> from rex.widget import responder

  >>> class WidgetWithResponder(Widget):
  ...   name = 'WidgetWithResponder'
  ...   js_type = 'pkg', 'WidgetWithResponder'
  ... 
  ...   title = Field(StrVal())
  ... 
  ...   @responder
  ...   def data(self, req):
  ...     return Response('my title is: ' + self.title)

  >>> w = WidgetWithResponder(title='Hi')

  >>> w
  WidgetWithResponder(...)

  >>> print(render_widget(w, Request.blank('/', accept='application/json'))) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["@js-package::rex-widget", "Chrome",
                {"content": ["^0",
                             ["@js-package::pkg", "WidgetWithResponder",
                              {"title": "Hi",
                               "data": ["~#url", ["http://localhost/@@/2.content.2.data"]]}]], "^2": "Hi"}]]

  >>> print(render_widget(
  ...   w,
  ...   Request.blank('/@@/2.content.2.data', accept='application/json'),
  ...   path='2.content.2.data',
  ... )) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  my title is: Hi

::

  >>> from rex.widget import PortURL

  >>> class WidgetWithPortResponder(Widget):
  ...   name = 'WidgetWithPortResponder'
  ...   js_type = 'pkg', 'WidgetWithPortResponder'
  ... 
  ...   title = Field(StrVal())
  ... 
  ...   @responder(url_type=PortURL)
  ...   def data(self, req):
  ...     return Response('my title is: ' + self.title)

  >>> w = WidgetWithPortResponder(title='Hi')

  >>> w
  WidgetWithPortResponder(...)

  >>> print(render_widget(w, Request.blank('/', accept='application/json'))) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["@js-package::rex-widget", "Chrome",
                {"content": ["^0",
                             ["@js-package::pkg", "WidgetWithPortResponder",
                              {"title": "Hi",
                               "data": ["~#port", ["http://localhost/@@/2.content.2.data"]]}]], "^2": "Hi"}]]

  >>> print(render_widget(
  ...   w,
  ...   Request.blank('/@@/2.content.2.data', accept='application/json'),
  ...   path='2.content.2.data',
  ... )) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: 15
  <BLANKLINE>
  my title is: Hi

  >>> class CompositionWithResponder(WidgetComposition):
  ...   name = 'CompositionWithResponder'
  ...   js_type = 'pkg', 'CompositionWithResponder'
  ... 
  ...   title = WidgetWithPortResponder.title.__clone__()
  ... 
  ...   def render(self):
  ...     return WidgetWithPortResponder(title=self.title)

  >>> w = CompositionWithResponder(title='ok')

  >>> print(render_widget(w, Request.blank('/', accept='application/json'))) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["@js-package::rex-widget", "Chrome",
                {"content": ["^0",
                            ["@js-package::pkg", "WidgetWithPortResponder",
                            {"title": "ok",
                             "data": ["~#port", ["http://localhost/@@/2.content.2.data"]]}]], "^2": "ok"}]]

  >>> print(render_widget(
  ...   w,
  ...   Request.blank('/@@/2.content.2.data', accept='application/json'),
  ...   path='2.content.2.data',
  ... )) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: 15
  <BLANKLINE>
  my title is: ok

Cleanup
-------

::

  >>> rex.off()

