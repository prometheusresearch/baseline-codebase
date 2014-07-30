/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react/addons');
var PropTypes = React.PropTypes;
var cx        = React.addons.classSet;

var CheckboxGroup = React.createClass({

  propTypes: {
    options: PropTypes.array.isRequired
  },

  render: function() {
    var className = cx(
      'rex-widget-CheckboxGroup__checkbox',
      this.props.layout === 'vertical' ? 'checkbox' : 'checkbox-inline'
    );
    var options = this.props.options.map((option) =>
      <div className={className}>
        <label>
          <input
            type="checkbox"
            onChange={this.onChange.bind(null, option.id)}
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

  onChange: function(id) {
  }
});

module.exports = CheckboxGroup;

