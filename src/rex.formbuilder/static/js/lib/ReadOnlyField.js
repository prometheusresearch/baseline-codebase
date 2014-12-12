/**
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var React         = require('react/addons');
var cx            = React.addons.classSet;
var ReactForms    = require('react-forms');

var ReadOnlyField = React.createClass({

  mixins: [ReactForms.FocusStore.FocusableMixin],

  render() {
    var {value: {value, node}, className, ...props} = this.props;
    var clsSet = {
      'rfb-ReadOnlyField': true,
      'rfb-ReadOnlyField--clickable': this.props.onClick
    };
    if (className)
      clsSet[className] = true;
    return (
      <div {...props}
        className={cx(clsSet)}
        onClick={this.onClick}>
        <div className="rfb-ReadOnlyField__label">
          {node.props.get('label')}
        </div>
        {value != null ?
          <div className="rfb-ReadOnlyField__value">
            {value}
          </div> :
          <div className="rfb-ReadOnlyField__noValue">
            no value
          </div>}
      </div>
    );
  },

  onClick() {
    if (this.props.onClick)
      this.props.onClick(this.props.value.keyPath);
  }
});


/*
var ReadOnlyField = React.createClass({

  render() {
    var {value, className, label, hint, ...props} = this.props;
    console.log('value', value);
    return (
      <div {...props} className={cx('rf-Field', 'rfb-ReadOnlyField', className)}>
        <ReactForms.Label
          className="rf-Field__label"
          label={label || value.node.props.get('label')}
          hint={hint || value.node.props.get('hint')}
          />
        <div className="rfb-ReadOnlyField__value">
          {value}
        </div>
      </div>
    );
  }
});
*/

module.exports = ReadOnlyField;
