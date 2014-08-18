/**
 * @jsx React.DOM
 */

'use strict';

var React     = require('react');  // Don't remove this, no matter what eslint says.
var localized = require('../localized');

/**
 * Mixin which provides methods for rendering label and help elements.
 *
 * @private
 */
var LabelRenderingMixin = {

  renderLabel: function(htmlFor) {
    if (this.props.noLabel) {
      return null;
    }
    return this.props.options.text ? (
      <label
          htmlFor={htmlFor}
          className="control-label rex-forms-Widget__label">
        <localized>{this.props.options.text}</localized>
      </label>
    ) : null;
  },

  renderHelp: function() {
    if (this.props.noHelp) {
      return null;
    }
    return this.props.options.help ? (
      <div className="rex-forms-Widget__help">
        <localized>{this.props.options.help}</localized>
      </div>
    ) : null;
  }

};

module.exports = LabelRenderingMixin;
