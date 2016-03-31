.. _styling:

Styling
=======

Rex Widget provides a mechanism to style React components using JavaScript. It
is exposed through ``rex-widget/stylesheet`` ES2015 module::

  import * as stylesheet from 'rex-widget/stylesheet';

There are a couple of different usage scenarious available using this module.

Producing styled DOM components
-------------------------------

The most basic use case it to produce a new React component based on some DOM
component with custom styles applied::

  import * as stylesheet from 'rex-widget/stylesheet';

  let FancyLabel = stylesheet.style('label', {
    color: 'red',
    background: 'yellow',
  });

The result of ``stylesheet.style()`` function is another React component
which can be used in any other composite component, in this case::

  <FancyLabel>First name:</FancyLabel>

The ``stylesheet.style(BaseComponent, style)`` function accepts two arguments.

The first argument ``BaseComponent`` specifies which DOM component should be
used as a base component.

The second ``style`` arguments is a JavaScript object which represents style
which sould be applied to the DOM component.

Creating restyleable composite components
-----------------------------------------

Creating styled DOM components is useful but what if we want to create some
"complex" React component which should have some of its UI restyleable.

Rex Widget solves that by introducing one special pattern for creating
restyleable composite components.

Example::

  import React from 'react';
  import * as stylesheet from 'rex-widget/stylesheet';

  import Hint from './Hint';

  class Field extends React.Component {

    static stylesheet = stylesheet.create({
      Input: 'input',
      Hint: Hint,
      Label: stylesheet.style('label', {
        fontWeight: 'bold'
      }),
    })

    render() {
      let {Label, Hint, Input} = this.constructor.stylesheet;
      return (
        <div>
          <Label />
          <Hint />
          <Input />
        </div>
      );
    }
  }

Note the following two things:

* We defined a stylesheet as a static property of ``<Field />>`` React
  component.

* We used ``this.constructor.stylesheet`` to refer to components defined in
  stylesheet.

Focus on ``stylesheet``. It's a mapping from names to React components. That
means we can use either DOM components (``'input'`` in the example above), other
composite components (``Hint`` above) and even results of ``stylesheet.style()``
function calls (see how we defined ``Label``).

Now if we want to restyle ``<Field />`` component::

  let FancyField = stylesheet.style(Field, {
    Label: {
      color: 'red',
    },
    Hint: FancyHint,
  });

We used the same ``stylesheet.style()`` function which we used to style DOM
components but now instead we pass it a restyleable composite component as the
first argument and *stylesheet override* as the second.

*Stylesheet override* is a mapping from names found in original stylesheets to
React components which should override old ones or stylesheet overrides which
will applied recursively.

The fact that ``stylesheet.style()`` applies itself recursively to DOM and
restyleable components means that if ``<Hint />`` was also restyleable composite
component (with ``Text`` key as a part of its stylesheet for example) we could
style it too in a single call::

  let FancyField = stylesheet.style(Field, {
    Label: {
      color: 'red',
    },
    Hint: {
      Text: {
        color: 'red'
      }
    }
  });

To better understand what's going on, the code above could be rewritten as::

  let FancyField = stylesheet.style(Field, {
    Label: stylesheet.style(FancyField.stylesheet.Label, {
      color: 'red',
    }),
    Hint: stylesheet.style(FancyField.stylesheet.Hint, {
      Text: stylesheet.style(Hint.stylesheet.Text, {
        color: 'red'
      })
    })
  });

This code does the same as the previous snippet but it's rather verbose. This is
why the shortcut exists.

Helpers for styling DOM components
----------------------------------

Module ``rex-widget/css`` provides helpers for writing CSS rules for styling DOM
components.

Example::

  import * as css from 'rex-widget/css';

  import * as stylesheet from 'rex-widget/stylesheet';

  let FancyLabel = stylesheet.style('label', {
    padding: css.padding(10), // expands to "10px 10px 10px 10px"
    border: css.border(1, '#ddd'), // expands to "1px solid #ddd"
  });
