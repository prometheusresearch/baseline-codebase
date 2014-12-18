/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var Select    = require('./Select');
var countKeys = require('./countKeys');
var cx        = React.addons.classSet;

// Default localizations
var LOCALIZATIONS = {
  'en': 'English',
  'fr': 'French',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'es': 'Spanish'
};

var LocalizedStringType = {
  deserialize: function(value) {
    if (value !== null && countKeys(value) === 0) {
      value = undefined;
    }
    return value;
  },

  serialize: function(value) {
    if (value === null || value === undefined) {
      value = {};
    }
    return value;
  }
};

var buildOptions = function (localizations) {
  var options = [];
  for (var name in localizations) {
    if (localizations.hasOwnProperty(name)) {
      var title = localizations[name];
      options.push({
        id: name,
        title: title
      });
    }
  }
  return options;
};

var LocalizationSelect = React.createClass({

  getDefaultProps: function () {
    return {
      options: buildOptions(LOCALIZATIONS)
    };
  },

  render: function() {
    return this.transferPropsTo(
      <Select className={cx("rfb-LocalizationSelect", this.props.className)}
              emptyValue={null} />
    );
  }
});

module.exports = {
  buildOptions: buildOptions,
  LOCALIZATIONS: LOCALIZATIONS,
  LocalizationSelect: LocalizationSelect,
  LocalizedStringType: LocalizedStringType
};
