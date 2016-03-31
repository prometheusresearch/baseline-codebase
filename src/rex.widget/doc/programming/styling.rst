.. _styling:

Styling
=======

Rex Widget provides a mechanism to style React components using JavaScript. It
is exposed through ``rex-widget/stylesheet`` ES2015 module::

  import * as stylesheet from 'rex-widget/stylesheet';

There are a couple of different usage scenarious which can be applied while
developing with Rex Widget.

Producing styled DOM components
-------------------------------

The most basic use case it to produce a new React component based on some DOM
component with some styles applied::

  let FancyLabel = stylesheet.style('label', {
    color: 'red',
    background: 'yellow',
  });

The result of ``stylesheet.style()`` function is the another React component
which can be used as a ``<label />`` on which it is based upon::

  <FancyLabel>First name:</FancyLabel>

The ``stylesheet.style(BaseComponent, style)`` function accepts two arguments.

The first argument ``BaseComponent`` specifies which DOM component should be
used as a base component.

The second ``style`` arguments is a JavaScript object which represents style
which sould be applied to the DOM component.


