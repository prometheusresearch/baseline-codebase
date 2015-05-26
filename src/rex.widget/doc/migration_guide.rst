Rex Widget 1.0.0 Migration Guide
================================

This document is intended to describe differences in Rex Widget v. 1.0.0 vs.
v 0.2.19 and help developers who are using it to migrate their code.

First and foremost, the main difference between those 2 versions is that
defining new widget classes is not supported via YAML configuration anymore
(while instantiation of widgets in `urlmap.yaml` remains the same).
This effectively means that `widget.yaml` is not considered by the framework
and should be removed. Let's look into all changes in details though.


widget.yaml
-------------

As previously stated, `widget.yaml` is not supported anymore. In 0.2.19-based
application it served 2 main purposes: defining slots for further overriding
and providing reasonable defaults improving re-usability of widgets.

The first use-case became easier. Before you had to do

widget.yaml::

  MyPage: !<MyWidgetPage>
    title: !slot
      name: title
      default: My Title
      doc: define the page title here

urlmap.yaml::

  /my-page:
    widget: !<MyPage>

urlmap_override.yaml::

  /my-page: !override
    widget: !<MyWidgetPage>
      title: My New Title


Now, without `widget.yaml` you do it as following

urlmap.yaml::

  /my-page:
    widget: !<MyWidgetPage>
        title: !slot
          name: title
          default: My Title
          doc: define the page title here

urlmap_override.yaml::

  /my-page:
    slots:
      title: My New Title

Note, that you don't have to know which widget is used to define the certain
URL, you only need to know slots you want to override.

The second use case is bit more complex. Imagine, you have a widget with
several fields, but in reality when using it you plan to change only a subset
of them, others may remain constants in all your use-cases. Before you would
do:

widget.yaml::

  MyWidget: !<BaseWidget>
    heading: The heading remains constant
    help_text: !slot
      name: help_text
      default: Help is changed for MyWidget, but can be ovverriden
    data: !slot
      name: data
      doc: provide port here

Now, this can be done from the Python code by subclassing the 
`WidgetComposition`::

  from rex.widget import WidgetComposition

  class MyWidget(WidgetComposition):

    name = 'MyWidget'
    help_text = BaseWidget.help_text.__clone__(
        default='Help is changed for MyWidget, but can be ovverriden'
    )
    data = BaseWidget.data.__clone__()

    def render(self):
        return BaseWidget(
            heading='The heading remains constant',
            help_text=help_text,
            data=data
        )

Note, that `MyWidget` doesn't have its own JavaScript implementation part and
completely relies on `BaseWidget`. In `MyWidget.render` method you can do even
more powerful substitutions and widget assemblings, but please note, that this
code is not executed in a context of request, so don't do request-specific
claculations there. If you need those take a look to `@computed_field`
decorator (will be described later in this document).


Python code
-----------

1. Please make sure that all import are done from either `rex.widget` or
   `rex.widget.libary` (if you're using the particular widget).

2. Default values for the fields are passed through the validator as well.
   The following code was correct before::

       class MyWidget(Widget):
           name = 'MyWidget'
           js_type = 'my-package/lib/MyWidget'
           str_field = Field(StrVal(), default=10)

   Now it'll break since `10` doesn't pass the `StrVal()` validator. To fix it
   you'd do::

       class MyWidget(Widget):
           name = 'MyWidget'
           js_type = 'my-package/lib/MyWidget'
           str_field = Field(OneOf(StrVal(), IntVal()), default=10)

3. `URLField` is removed, please use `Field(URLVal())` instead.

4. `StateField` is removed. Dependns on what you're doing please use
   `Field(EntitySpecVal())`, `Field(CollectionSpecVal())` or
   `@computed_field` decorator.

5. `@computed_field` decorator is used in cases when your widget needs to
   calculate the server-side value at runtime based on request, server
   setting, database or some other server/request state. Before you'd do
   it as::

        @Widget.define_state(StrVal(), persistence=State.INVISIBLE)
        def site_root(self, state, graph, request):
            root_package = list(get_packages())[0]
            return url_for(request, '%s:/' % root_package.name)

   Now it is::

        @computed_field
        def site_root(self, request):
            root_package = list(get_packages())[0]
            return url_for(request, '%s:/' % root_package.name)

  In this example `site_root` is passed to JavaScript as one of `props`:
  `this.props.siteRoot`.
  One of typical use cases would be to get the query string parameter and pass
  it to the widget as `this.props.*`::

      @computed_field
      def uid(self, request):
          return request.GET.get('uid')


JavaScript
----------

1. Make sure the `require` statement says::

    var RexWidget = require('rex-widget'); // not require('rex-widget/lib/modern')

2. Never require anything from inside `rex-widget/lib`. All public widgets and
   functions are exposed::

    var RexWidget                       = require('rex-widget');
    var {collection, entity, computed}  = RexWidget.DataSpecification;
    var {VBox, HBox}                    = RexWidget.Layout;

   If some widget you're using is not exposed please fill free to contact or
   send pull request.

3. If you used `merge` function defined in RexWidget, please switch to using
   ES6 spread operator::

    var obj = merge(part1, part2); // wrong way, don't do it!
    var obj = {...part1, ...part2}; // right way

   For more details see Spread_ operator specification/examples.

.. _Spread: https://github.com/sebmarkbage/ecmascript-rest-spread
