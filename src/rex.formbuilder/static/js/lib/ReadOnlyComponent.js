/**
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var React         = require('react/addons');
var {OrderedMap}  = require('immutable');
var cx            = React.addons.classSet;
var ReactForms    = require('react-forms');
var Select        = require('./Select');

var ReadOnlyField = React.createClass({

  render() {
    var {value, className, label, hint, ...props} = this.props;
    return (
      <div {...props} className={cx('rf-Field', 'rfb-ReadOnlyField', className)}>
        <ReactForms.Label
          className="rf-LocalizedString__label"
          label={label || value.node.props.get('label')}
          hint={hint || value.node.props.get('hint')}
          />
        <div className="rfb-LocalizedString__control">
          <div className="rfb-LocalizedString__select">
            <Select
              emptyValue={false}
              options={options}
              onChange={this.onChange}
              />
          </div>
          <ReactForms.Element
            className="rfb-LocalizedString__element"
            value={value.get(localization)}
            />
        </div>
      </div>
    );
  },

  getInitialState() {
    return {localization: null};
  },

  onChange(localization) {
    this.setState({localization});
  }
});

module.exports = ReadOnlyField;
