::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.widget_demo')
    >>> demo.on()

    >>> from rex.widget import Widget

    >>> screen = Widget.parse("""
    ... !<Section>
    ... - !<Header> Welcome to rex.widget_demo
    ... - !<Label> This is a humble label.
    ... - !<Panel>
    ...   left: !<Label> This is the left panel
    ...   right:
    ...   - !<Header> Main Panel
    ...   - !<Label> This is the main panel
    ... """)

    >>> print screen
    !<Section>
    content:
    - !<Header>
      text: Welcome to rex.widget_demo
    - !<Label>
      text: This is a humble label.
    - !<Panel>
      left: !<Label>
        text: This is the left panel
      right:
      - !<Header>
        text: Main Panel
      - !<Label>
        text: This is the main panel

    >>> print repr(screen)      # doctest: +NORMALIZE_WHITESPACE
    SectionWidget(content=GroupWidget(children=[HeaderWidget(text=u'Welcome to rex.widget_demo'), LabelWidget(text=u'This is a humble label.'), PanelWidget(left=LabelWidget(text=u'This is the left panel'), right=GroupWidget(children=[HeaderWidget(text=u'Main Panel'), LabelWidget(text=u'This is the main panel')]))]))

    >>> from webob import Request

    >>> req = Request.blank('/')
    >>> print screen(req)           # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    200 OK
    ...
    <html lang="en">
    ...
    <div>
    <h1>Welcome to rex.widget_demo</h1>
    This is a humble label.
    <div class="row">
    <div class="col-md-6">
    This is the left panel
    </div>
    <div class="col-md-6">
    <h1>Main Panel</h1>
    This is the main panel
    </div>
    </div>
    </div>
    ...
    </html>

