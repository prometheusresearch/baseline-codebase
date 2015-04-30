How-to guides
=============

This page contains various how-to guides on the most common topics. It tries to
refer to relevant parts of the documentation to solve practical tasks arising
while using Rex Widget framework.

How to pass params to a widget from another page
------------------------------------------------

If widget uses state cells with params::

  getInitialState() {
    return {
      name: RexWidget.cell(null, {param: 'name'})
    }
  }

Then state cell can be initialized from ``?name=...`` URL parameter. That means
that by generating a link with ``?name=...`` parameter you can set the value of
``this.state.name.value`` to this parameter value. You can use ``Link`` widget
for that::

  <RexWidget.Link href="/page" params={{name: 'somename'}} />

Now component with the state cell above will have ``'somename'`` as a value of
``this.state.name.value``.

How to pass params to a widget in an iframe
-------------------------------------------

See the guide above. You need to generate ``src`` attribute of an iframe with
parameters corresponding to state cells in widgets on the target page.
