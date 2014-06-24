/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var isString  = require('./utils').isString;

// TODO: Replace with actual gettext function
function _(msg, params) {
  params = params || {};
  return msg.replace(/%\(([a-zA-Z0-9]+)\)s/g, (m, k) => params[k]);
}

var ContextTypes = {
  localize: React.PropTypes.func,
  locale: React.PropTypes.string
};

var LocalizerMixin = {

  childContextTypes: ContextTypes,

  getChildContext: function() {
    return {
      localize: this.localize,
      locale: this.getLocale()
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
