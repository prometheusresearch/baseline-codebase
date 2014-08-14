/**
 * @jsx React.DOM
 */
'use strict';

var React       = require('react/addons');
var cx          = React.addons.classSet;
var WidgetMixin = require('./WidgetMixin');
var _           = require('../localization')._;

var ToggleText = React.createClass({
  mixins: [WidgetMixin],

  propTypes: {
    toggleText: React.PropTypes.string.isRequired,
    cancelText: React.PropTypes.string,
    label: React.PropTypes.string.isRequired
  },

  getDefaultProps: function () {
    return {
      cancelText: _("I don't want to provide this information.")
    };
  },

  getInitialState: function () {
    return {
      toggleForced: !!this.getValue()
    };
  },

  toggleDisplay: function (e) {
    e.preventDefault();
    this.setState({toggleForced: !this.state.toggleForced});
  },

  cancelInput: function (e) {
    var empty = this.value().updateSerialized(null);
    this.onValueUpdate(empty);
    this.toggleDisplay(e);
  },

  renderInput: function () {
    var required = this.props.required || this.value().schema.props.required;
    var showToggle = (
      !required &&
      !(this.state.toggleForced || this.getValue())
    );

    var className = cx(
      'rex-forms-ToggleText__input',
      required ? 'rex-forms-ToggleText__input--required' : null,
      'form-group'
    );

    return this.transferPropsTo(
      <div className="rex-forms-ToggleText">
        {showToggle ?
          <div className="rex-forms-ToggleText__toggle">
            <a href="#" onClick={this.toggleDisplay}>{this.props.toggleText}</a>
          </div> :
          null}
        {!showToggle ?
          <div className={className}>
            <label
              className="rex-forms-Widget__label"
              htmlFor={this.getInputName()}>
              {this.props.label}
            </label>
            <textarea
              className="form-control width-medium height-small"
              id={this.getInputName()}
              name={this.getInputName()}
              onChange={this.onChange}
              value={this.getValue()}
              />
            {!required ?
              <div className="rex-forms-ToggleText__cancel">
                <a href="#" onClick={this.cancelInput}>{this.props.cancelText}</a>
              </div> :
              null}
          </div> :
          null}
      </div>
    );
  }
});


module.exports = ToggleText;
