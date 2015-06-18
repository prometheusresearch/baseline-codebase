State cells
===========

State cells is a simple state tracking mechanism provided by Rex Widget.

It allows one to bind parts of the state to the browser's querystring 
so that changes in
the state can influence the browser's location and history, and vice-versa.

Basic usage example
-------------------

The API is simple, instead of returning an ordinary value from the
``getInitialState()`` callback of a widget, return a cell::

  var RexWidget = require('rex-widget');

  var UsersList = RexWidget.createWidgetClass({

    getInitialState() {
      return {
        selected: RexWidget.cell(null)
      };
    },

    render() {
      var selectedValue = this.state.selected.value;
      return (
        <RexWidget.Select
          value={this.state.selected.value}
          onChange={this.state.selected.update}
          />
      );
    }
  });

As you can see the ``value`` property of the cell represents the current cell
value, the ``null`` in this example is the initial state.

To change the value we need to call the ``update(nextValue)`` method of the
cell::

  this.state.selected.update(nextSelected)

Which is equivalent to ``this.setState({selected: nextSelected})`` if we weren't
using cells but a plain value for representing the selected state.

Another advantage of using cells for managing the UI state is that cells are
first class values which represent both read and update operations.  We
can pass them to other widgets via a single prop.

Reflecting state cells value in URL parameters
----------------------------------------------

When defining a state cell, it can be configured to reflect its value to 
a URL parameter::

  getInitialState() {
    return {
      selected: RexWidget.cell(null, {param: 'user'})
    };
  }

Now the initial state cell value will be read from the ``?user=...`` parameter. 
And on updates to the cell's state the parameter will also be updated.

That makes the browser history mechanism work with state cells. 
The browser's back button
now can be used to travel back in time through different ``selected`` values.

Another use case for this is to pass parameters to a widget from another page
through a link which can be declared with params for specific state cells.

