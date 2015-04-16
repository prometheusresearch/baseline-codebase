State cells
===========

State cells is a feature of Rex Widget to manage parts of UI state in widgets
and map them to page's querystring so the changes in state can influence browser
location and history and vice-versa.

The API is simple, instead of returning an ordinary value from
``getInitialState()`` callback of a widget, return a cell::

  var RexWidget = require('rex-widget')

  var UsersList = RexWidget.createWidgetClass({

    getInitialState() {
      return {
        selected: RexWidget.cell(null)
      }
    },

    render() {
      var selectedValue = this.state.selected.value
      return ...
    }
  })

As you can see the ``value`` property of cell represents the current cell value,
the ``null`` in this example in the initial state.

To change the value we need to call ``update(nextValue)`` method of the cell::

  this.state.selected.update(nextSelected)

Which is equivalent to ``this.setState({selected: nextSelected})`` if we weren't
using cells but a plain value for representing selected state.

The advantage of using cells for managing UI state is that cells are first class
values which represent both ways to read and update operations. We can pass them
to other widgets via a single prop.
