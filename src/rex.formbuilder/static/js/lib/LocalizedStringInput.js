/**
 * @jsx React.DOM
 */
'use strict';

var React              = require('react');
var {Map}              = require('immutable');
var localization       = require('./localization');
var LocalizationSelect = localization.LocalizationSelect;
var mergeInto          = require('./mergeInto');
var countKeys          = require('./countKeys');
var cx                 = React.addons.classSet;

var LocalizedStringInput = React.createClass({

  getDefaultProps: function () {
    return {
      localizations: localization.LOCALIZATIONS,
      multiline: false,
      value: Map.empty()
    };
  },

  getInitialState: function () {
    var active = null;
    for (var name in this.props.localizations) {
      if (this.props.localizations.hasOwnProperty(name)) {
        active = name;
        break;
      }
    }
    return {active: active};
  },

  onTextChanged: function (e) {
    var value = e.target.value ? e.target.value : '';
    var active = this.state.active;
    var nextValue = Map.from(this.props.value);
    if (value.trim()) {
      nextValue = nextValue.set(active, value);
    } else if (nextValue.has(active)) {
      nextValue = nextValue.remove(active);
    }
    this.props.onChange(nextValue);
  },

  onLocalizationChanged: function (locale) {
    this.setState({active: locale});
  },

  renderInput: function (inputValue) {
    if (this.props.multiline) {
      return (
        <textarea value={inputValue} onChange={this.onTextChanged} />
      );
    }
    return (
      <input type="text" value={inputValue} onChange={this.onTextChanged} />
    );
  },

  render: function() {
    var {localizations, value} = this.props;
    value = Map.from(value);
    var {active} = this.state;
    var localizationOptions = localization.buildOptions(
      this.props.localizations
    );
    var inputValue = active ? value.get(active, '') : '';
    for (var i in localizationOptions) {
      var option = localizationOptions[i];
      if (value.get(option.id)) {
        option.title = '* ' + option.title;
      }
    }
    var classes = {
      'rfb-LocalizedStringInput': true,
      'rfb-LocalizedStringInput-multiline': this.props.multiline
    };
    return (
      <div className={cx(classes)}>
        <LocalizationSelect options={localizationOptions} 
                            onChange={this.onLocalizationChanged} />
        {this.renderInput(inputValue)}
      </div>
    );
  }
});

module.exports = LocalizedStringInput;
