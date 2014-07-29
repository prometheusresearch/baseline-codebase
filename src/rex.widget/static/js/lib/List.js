/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react/addons');
var PropTypes     = React.PropTypes;
var cx            = React.addons.classSet;
var Preloader     = require('./Preloader');
var emptyFunction = require('./emptyFunction');

var List = React.createClass({

  propTypes: {
    selected: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
      ]),
    onSelected: PropTypes.func,
    itemRenderer: PropTypes.func
  },

  render: function() {
    if (this.props.data.updating) {
      return <Preloader />;
    }
    var items = this.renderItems();
    return (
      <ul className={cx("rex-widget-List", this.props.className)}>
        {items}
      </ul>
    );
  },

  renderItems: function() {
    var renderer = this.props.itemRenderer || itemRenderer;
    return this.props.data.data.map((item) => {
      var selected = this.props.selected === item.id;
      var selectable = this.props.selectable;
      var className = cx({
        'rex-widget-List__item': true,
        'rex-widget-List__item--selected': selectable && selected
      });
      var onClick = selectable ?
        this.props.onSelected.bind(null, item.id) :
        emptyFunction;
      return (
        <li key={item.id} className={className} onClick={onClick}>
          {renderer(item)}
        </li>
      );
    });
  }
});

function itemRenderer(item) {
  console.log(item);
  return item.code;
}

module.exports = List;
