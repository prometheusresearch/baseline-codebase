
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

  >>> rex = Rex('-', 'rex.widget', db='pgsql:widget_demo')
  >>> rex.on()

Widget
------

::

  >>> class MyWidget(Widget):
  ...
  ...   name = 'MyWidget'
  ...   js_type = 'rex-widget/MyWidget'
  ...
  ...   title = Field(StrVal())
  ...
  ...   desc = Field(StrVal(), default='no desc')
  ...
  ...   @computed_field
  ...   def computed(self, req):
  ...     return 'computed!'

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
  Error: Missing mandatory field:
      title
  Of widget:
      MyWidget

  >>> MyWidget(title=42) # doctest: +NORMALIZE_WHITESPACE +ELLIPSIS
  Traceback (most recent call last):
  ...
  Error: Expected a string
  Got:
      42
  While validating field:
      title
  Of widget:
      MyWidget

  >>> w = MyWidget(title='Ok')
  >>> w
  MyWidget(desc='no desc', title='Ok')

  >>> w.title
  'Ok'

  >>> req = Request.blank('/')
  >>> encode(w, req)
  u'["~#widget", ["rex-widget/MyWidget", {"desc": "no desc", "title": "Ok", "computed": "computed!"}]]'

  >>> w.__clone__(title='notok')
  MyWidget(desc='no desc', title='notok')

  >>> MyWidget.parse("""
  ... title: OK
  ... """)
  MyWidget(desc='no desc', title='OK')

  >>> MyWidget.parse("""
  ... !<MyWidget>
  ... title: OK
  ... """)
  MyWidget(desc='no desc', title='OK')

  >>> MyWidget.parse("""
  ... !<MyWidget> OK
  ... """)
  MyWidget(desc='no desc', title='OK')

Widget with non-transitionable field
------------------------------------

::
  
  >>> rex.cache.clear()

  >>> class WidgetWithNonTransitionableField(Widget):
  ...
  ...   name = 'WidgetWithNonTransitionableField'
  ...   js_type = 'rex-widget/WidgetWithNonTransitionableField'
  ...
  ...   title = Field(StrVal())
  ...
  ...   db = Field(StrVal(), transitionable=False)

  >>> w = WidgetWithNonTransitionableField(title='Title', db='db!')

  >>> w
  WidgetWithNonTransitionableField(db='db!', title='Title')

  >>> req = Request.blank('/')
  >>> encode(w, req)
  u'["~#widget", ["rex-widget/WidgetWithNonTransitionableField", {"title": "Title"}]]'

Null widget
-----------

::

  >>> from rex.widget import NullWidget
  >>> w = NullWidget()
  >>> w
  NullWidget()

  >>> req = Request.blank('/')
  >>> encode(w, req)
  u'["~#\'", null]'

Group widget
------------

::

  >>> from rex.widget import GroupWidget
  >>> w = GroupWidget(children=[NullWidget()])
  >>> w
  GroupWidget(children=[NullWidget()])

  >>> req = Request.blank('/')
  >>> encode(w, req)
  u'[null]'


Nested widget hierarchy
-----------------------

::

  >>> rex.cache.clear()

  >>> class ComplexWidget(Widget):
  ...   name = 'ComplexWidget'
  ...   js_type = 'ComplexWidget'
  ...   children = Field(WidgetVal())

  >>> w = ComplexWidget(children=MyWidget(title='title'))

  >>> w
  ComplexWidget(children=MyWidget(desc='no desc', title='title'))

  >>> req = Request.blank('/')
  >>> encode(w, req) # doctest: +NORMALIZE_WHITESPACE
  u'["~#widget", ["ComplexWidget",
                  {"children": ["^0", ["rex-widget/MyWidget",
                                       {"desc": "no desc", "title": "title", "computed": "computed!"}]]}]]'

  >>> w = ComplexWidget(children=[MyWidget(title='title')])

  >>> w
  ComplexWidget(children=GroupWidget(children=[MyWidget(desc='no desc', title='title')]))

  >>> req = Request.blank('/')
  >>> encode(w, req) # doctest: +NORMALIZE_WHITESPACE
  u'["~#widget", ["ComplexWidget",
                  {"children": [["^0", ["rex-widget/MyWidget",
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
  MyWidgetComposition(title='ok')

  >>> w = MyWidgetComposition.parse("""
  ... !<MyWidgetComposition>
  ... title: ok
  ... """)

  >>> w
  MyWidgetComposition(title='ok')

  >>> req = Request.blank('/')
  >>> encode(w, req) # doctest: +NORMALIZE_WHITESPACE
  u'["~#widget", ["rex-widget/MyWidget", {"desc": "no desc", "title": "ok!", "computed": "computed!"}]]'

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
  Error: Expected a string
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
  Error: Expected a string
  Got:
      42
  While validating field:
      title
  Of widget:
      MyWidget
  While parsing:
      "<...>", line 2

Widget pointer
--------------

::

  >>> from rex.widget.pointer import Pointer

  >>> class WidgetWithPointer(Widget):
  ...   name = 'WidgetWithPointer'
  ...   js_type = 'WidgetWithPointer'
  ...
  ...   @computed_field
  ...   def pointer(self):
  ...     return Pointer(self)
  ...
  ...   def respond(self, req):
  ...     return Response('ok')

  >>> w = WidgetWithPointer()

  >>> print render_widget(w, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome", {"content": ["^0", ["WidgetWithPointer", {"pointer": ["~#url", ["http://localhost/?__to__=1.content"]]}]], "title": null}]]

  >>> print render_widget(w, Request.blank('/?__to__=', accept='application/json')) # doctest: +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ok

  >>> w = ComplexWidget(children=WidgetWithPointer())

  >>> print render_widget(w, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome", {"content": ["^0", ["ComplexWidget", {"children": ["^0", ["WidgetWithPointer", {"pointer": ["~#url", ["http://localhost/?__to__=1.content.1.children"]]}]]}]], "title": null}]]

  >>> print render_widget(w, Request.blank('/?__to__=1.children', accept='application/json')) # doctest: +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ok

  >>> w = ComplexWidget(children=[WidgetWithPointer()])

  >>> print render_widget(w, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome", {"content": ["^0", ["ComplexWidget", {"children": [["^0", ["WidgetWithPointer", {"pointer": ["~#url", ["http://localhost/?__to__=1.content.1.children.0"]]}]]]}]], "title": null}]]

  >>> print render_widget(w, Request.blank('/?__to__=1.children.0', accept='application/json')) # doctest: +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ok

Pointer to field::

  >>> class WidgetWithFieldPointer(Widget):
  ...   name = 'WidgetWithFieldPointer'
  ...   js_type = 'WidgetWithFieldPointer'
  ...
  ...   @computed_field
  ...   def pointer(self):
  ...     return Pointer(self, to_field=True)

  >>> w = WidgetWithFieldPointer()

  >>> print render_widget(w, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome", {"content": ["^0", ["WidgetWithFieldPointer", {"pointer": ["~#url", ["http://localhost/?__to__=1.content.1.pointer"]]}]], "title": null}]]

Pointer with wrapper::

  >>> class WidgetWithWrappedPointer(Widget):
  ...   name = 'WidgetWithWrappedPointer'
  ...   js_type = 'WidgetWithWrappedPointer'
  ...
  ...   @computed_field
  ...   def pointer(self):
  ...     return Pointer(self, to_field=True, wrap=self.wrap)
  ...
  ...   def wrap(self, widget, url):
  ...     return [url]

  >>> w = WidgetWithWrappedPointer()

  >>> print render_widget(w, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome", {"content": ["^0", ["WidgetWithWrappedPointer", {"pointer": [["~#url", ["http://localhost/?__to__=1.content.1.pointer"]]]}]], "title": null}]]


Responder field
---------------

::

  >>> from rex.widget import responder

  >>> class WidgetWithResponder(Widget):
  ...   name = 'WidgetWithResponder'
  ...   js_type = 'WidgetWithResponder'
  ...
  ...   title = Field(StrVal())
  ...
  ...   @responder
  ...   def data(self, req):
  ...     return Response('my title is: ' + self.title)

  >>> w = WidgetWithResponder(title='Hi')

  >>> w
  WidgetWithResponder(title='Hi')

  >>> print render_widget(w, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome",
                {"content": ["^0",
                             ["WidgetWithResponder",
                              {"title": "Hi",
                               "data": ["~#url", ["http://localhost/?__to__=1.content.1.data"]]}]], "^2": "Hi"}]]

  >>> print render_widget(w, Request.blank('/?__to__=1.data', accept='application/json')) # doctest: +ELLIPSIS
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  my title is: Hi

::

  >>> from rex.widget import PortURL

  >>> class WidgetWithPortResponder(Widget):
  ...   name = 'WidgetWithPortResponder'
  ...   js_type = 'WidgetWithPortResponder'
  ...
  ...   title = Field(StrVal())
  ...
  ...   @responder(url_type=PortURL)
  ...   def data(self, req):
  ...     return Response('my title is: ' + self.title)

  >>> w = WidgetWithPortResponder(title='Hi')

  >>> w
  WidgetWithPortResponder(title='Hi')

  >>> print render_widget(w, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome",
                {"content": ["^0",
                             ["WidgetWithPortResponder",
                              {"title": "Hi",
                               "data": ["~#port", ["http://localhost/?__to__=1.content.1.data"]]}]], "^2": "Hi"}]]

  >>> print render_widget(w, Request.blank('/?__to__=1.data', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: 15
  <BLANKLINE>
  my title is: Hi

  >>> class CompositionWithResponder(WidgetComposition):
  ...   name = 'CompositionWithResponder'
  ...   js_type = 'CompositionWithResponder'
  ...
  ...   title = WidgetWithPortResponder.title.__clone__()
  ...
  ...   def render(self):
  ...     return WidgetWithPortResponder(title=self.title)

  >>> w = CompositionWithResponder(title='ok')

  >>> print render_widget(w, Request.blank('/', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: application/json; charset=UTF-8
  Content-Length: ...
  <BLANKLINE>
  ["~#widget", ["rex-widget/lib/Chrome",
                {"content": ["^0",
                            ["WidgetWithPortResponder",
                            {"title": "ok",
                             "data": ["~#port", ["http://localhost/?__to__=1.content.1.data"]]}]], "^2": "ok"}]]

  >>> print render_widget(w, Request.blank('/?__to__=1.data', accept='application/json')) # doctest: +ELLIPSIS +NORMALIZE_WHITESPACE
  200 OK
  Content-Type: text/html; charset=UTF-8
  Content-Length: 15
  <BLANKLINE>
  my title is: ok

Cleanup
-------

::

  >>> rex.off()
