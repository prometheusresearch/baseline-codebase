/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var cx    = require('classnames');

// we use this to mark empty value, otherwise DOM will use option's title as
// value
var sentinel = '__empty_value_sentinel__';

/**
 * This component creates a drop-down list of items.
 *
 * Each item in the list is an object which must have the properties 
 * **id** and **title**.  
 * The id is a unique identifier for the item, 
 * and the title is the text which appears in the drop-down for the item.
 *
 * To have the first item be an empty value, set **noEmptyValue** to false,
 * and set **emptyValue** to anything which is true.  
 * You may provide the text to appear for the empty value 
 * in **titleForEmpty** or you may set 
 * **emptyValue** to an object with a **title** property.
 *
 * Any **options** appear next in the list followed by any items in **data**. 
 */
var Select = React.createClass({

  propTypes: {
    /**
     * This string or number was perhaps intended to select 
     * the initial value for the drop-down but it has no effect.
     */
    value: React.PropTypes.oneOfType([React.PropTypes.string,
                                      React.PropTypes.number]),
    /**
     * Empty value to appear first in the drop-down list.
     */
    emptyValue: React.PropTypes.object,

    /**
     * Set to false, if you want an empty value in the drop-down list.
     */
    noEmptyValue: React.PropTypes.bool,

    /**
     * The title of the empty value.
     */
    titleForEmpty: React.PropTypes.string,

    /**
     * This object must have a **data** property which contains 
     * the list of items to appear in the drop-down after the options.
     * Each element in the list must have an id and a title.
     */
    data: React.PropTypes.object,

    /**
     * The list of items to appear in the drop-down before the data.
     * Each element in the list must have an id and a title.
     */
    options: React.PropTypes.array,

    /**
     * This function will be called when the user selects an item.
     * It is called with 2 arguments: id and value.  
     * Both id and value will be set to the id of the item the user selected. 
     */
    onValue: React.PropTypes.func.isRequired,
  },

  render() {
    var {emptyValue, titleForEmpty, noEmptyValue, quiet, value, ...props} = this.props;
    var options = this.props.options ? this.props.options : [];
    var data = this.props.data ? (this.props.data.data || []) : [];

    if (value === undefined || value === null) {
      value = sentinel;
    }

    var className = cx({
      'rw-Select': true,
      'rw-Select--quiet': quiet
    });

    return (
      <select {...props} className={className} value={value} onChange={this.onChange}>
        {emptyValue && !noEmptyValue &&
          <option key={sentinel} value={sentinel}>
            {titleForEmpty ? titleForEmpty : emptyValue.title}
          </option>}
        {options.concat(data).map((o) =>
          <option key={o.id} value={o.id}>{o.title}</option>
        )}
      </select>
    );
  },

  getDefaultProps() {
    return {
      emptyValue: {id: sentinel, title: ''},
      options: [],
      data: null
    };
  },

  onChange(e) {
    var value = e.target.value;
    var id    = e.target.id;
    if (value === sentinel) {
      value = null;
    }
    this.props.onValue(value, id);
  }
});

module.exports = Select;
