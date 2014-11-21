/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var isString  = require('./utils').isString;
var RexI18N   = require('rex-i18n');


function _(msg, params) {
  var i18n = RexI18N.getInstance();
  return i18n.gettext(msg, params).toString();
}

var ContextTypes = {
  localize: React.PropTypes.func,
  locale: React.PropTypes.string,
  parameters: React.PropTypes.object
};

var LocalizerMixin = {

  childContextTypes: ContextTypes,

  getChildContext: function() {
    return {
      localize: this.localize,
      locale: this.getLocale(),
      parameters: this.getParameters()
    };
  }
};

var LocalizedMixin = {

  contextTypes: ContextTypes,

  localize: function(lso) {
    return isString(lso) ? lso : this.context.localize(lso);
  }
};

module.exports = {LocalizerMixin, LocalizedMixin, _};
