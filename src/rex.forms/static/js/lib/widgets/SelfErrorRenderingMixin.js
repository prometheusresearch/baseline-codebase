/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');
var localized = require('../localized');

/**
 * Mixin which renders error of the value itself.
 *
 * @private
 */
var SelfErrorRenderingMixin = {

  renderError: function() {
    var failure = this.value().validation.validation.failure;

    if (failure !== undefined) {
      return (
        <div className="rex-forms-Widget__error">
          <localized>{this.props.options.error || failure}</localized>
        </div>
      );
    }
  }
};

module.exports = SelfErrorRenderingMixin;
