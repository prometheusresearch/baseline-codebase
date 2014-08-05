/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react/addons');
var PropTypes     = React.PropTypes;
var cx            = React.addons.classSet;
var emptyFunction = require('rex-widget/lib/emptyFunction');

var CheckboxGroup = React.createClass({

  propTypes: {
    options: PropTypes.array.isRequired,
    value: PropTypes.array,
    onValue: PropTypes.func
  },

  render: function() {
    var className = cx(
      'rex-widget-CheckboxGroup__checkbox',
      this.props.layout === 'vertical' ? 'checkbox' : 'checkbox-inline'
    );
    var options = this.props.options.map((option) =>
      <div key={option.id} className={className}>
        <label>
          <input
            checked={this.props.value && this.props.value.indexOf(option.id) > -1}
            type="checkbox"
            onChange={this.onValue.bind(null, option.id)}
            />
          {option.title}
        </label>
      </div>
    );
    return (
      <div className="rex-widget-CheckboxGroup">
        {options}
      </div>
    );
  },

  getDefaultProps: function() {
    return {
      value: [],
      onValue: emptyFunction
    };
  },

  onValue: function(id, e) {
    var value = this.props.value ? this.props.value.slice(0) : [];
    if (e.target.checked) {
      value.push(id);
    } else {
      value.splice(value.indexOf(id), 1);
    }
    this.props.onValue(value);
  }
});

module.exports = CheckboxGroup;

