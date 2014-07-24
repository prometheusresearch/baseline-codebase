::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.widget')
    >>> demo.on()

    >>> from rex.widget import Widget

Widget tree is defined using YAML::

    >>> screen = Widget.parse("""
    ... !<TwoColumnLayout>
    ... sidebar: !<Label> just a sidebar
    ... main:
    ...   - !<Header> Welcome to rex.widget_demo
    ...   - !<Label> This is a humble label.
    ... """)

You can get back YAML representation of the widget tree by printing the widget
instance::

    >>> print screen
    !<TwoColumnLayout>
    sidebar: !<Label>
      text: just a sidebar
    main:
    - !<Header>
      text: Welcome to rex.widget_demo
    - !<Label>
      text: This is a humble label.

The ``repr`` also gives a readable representation of the widget tree::

    >>> print repr(screen)      # doctest: +NORMALIZE_WHITESPACE
    TwoColumnLayoutWidget(sidebar=LabelWidget(text=u'just a sidebar'), main=GroupWidget(children=[HeaderWidget(text=u'Welcome to rex.widget_demo'), LabelWidget(text=u'This is a humble label.')]))

Widget can also handle WSGI requests, the default representation is
``text/html``::

    >>> from webob import Request

    >>> req = Request.blank('/')
    >>> print screen(req)           # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    200 OK
    Content-Type: text/html; charset=UTF-8
    ...
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/bundle/bundle.css">
    </head>
    <body>
      <div id="__main__"></div>
      <script>
        var __MOUNT_PREFIX__ = "";
      </script>
      <script src="/bundle/bundle.js"></script>
      <script>
        var __REX_WIDGET__ = {
          "state": {},
          "ui": {
            "__type__": "rex-widget/lib/TwoColumnLayout",
            "props": {
              "sidebar": {
                "__type__": "rex-widget/lib/Label",
                "props": {
                  "text": "just a sidebar"
                }
              },
              "main": {
                "__children__": [
                  {
                    "__type__": "rex-widget/lib/Header",
                    "props": {
                      "text": "Welcome to rex.widget_demo"
                    }
                  },
                  {
                    "__type__": "rex-widget/lib/Label",
                    "props": {
                      "text": "This is a humble label."
                    }
                  }
                ]
              },
              "sidebarWidth": 3
            }
          }
        };
        if (window.Rex === undefined || window.Rex.Widget === undefined) {
          throw new Error('include rex-widget bower package in your application');
        }
        Rex.Widget.renderSpec(
          __REX_WIDGET__,
          document.getElementById('__main__')
        );
      </script>
    </body>

A JavaScript application can also request ``application/json`` representation of
the UI::

    >>> req = Request.blank('/')
    >>> req.accept = 'application/json'
    >>> print screen(req)           # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    ...
    {
      "state": {},
      "ui": {
        "__type__": "rex-widget/lib/TwoColumnLayout",
        "props": {
          "sidebar": {
            "__type__": "rex-widget/lib/Label",
            "props": {
              "text": "just a sidebar"
            }
          },
          "main": {
            "__children__": [
              {
                "__type__": "rex-widget/lib/Header",
                "props": {
                  "text": "Welcome to rex.widget_demo"
                }
              },
              {
                "__type__": "rex-widget/lib/Label",
                "props": {
                  "text": "This is a humble label."
                }
              }
            ]
          },
          "sidebarWidth": 3
        }
      }
    }
