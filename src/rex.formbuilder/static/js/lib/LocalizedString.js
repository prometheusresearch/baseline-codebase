/**
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

var React         = require('react/addons');
var {OrderedMap}  = require('immutable');
var cx            = React.addons.classSet;
var ReactForms    = require('react-forms');
var Select        = require('./Select');
var TextArea      = require('./TextArea');

var DEFAULT_LOCALIZATIONS = OrderedMap({en: 'English'});

var LocalizedString = React.createClass({

  render() {
    var {value, className, label, hint, ...props} = this.props;
    var multiline = value.node.props.get('multiline') || false;
    var localizations = value.node.props.get('localizations') || DEFAULT_LOCALIZATIONS;
    var localization = this.state.localization || localizations.keySeq().first();
    var options = localizations.map((v, k) => ({id: k, title: v})).toArray();
    var input = multiline ? <TextArea className="rfb-LocalizedString__textarea" /> : null;
    var classes = {
      'rfb-LocalizedString': true,
      'rfb-LocalizedString--multiline': multiline
    };
    if (className) {
      classes[className] = true;
    }
    return (
      <div {...props} className={cx(classes)}>
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
            input={input}
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

module.exports = LocalizedString;
