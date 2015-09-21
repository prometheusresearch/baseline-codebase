/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                           = require('react');
var ConfigurableEntityForm          = require('./ConfigurableEntityForm');
var {makeDeprecatedComponentMixin}  = require('../DeprecatedComponent');


/**
 *  ConfigurableForm component.
 *
 * Use <RexWidget.Forms.ConfigurableEntityForm /> instead.
 *
 * @deprecated
 * @public
 */
var ConfigurableForm = React.createClass({
  mixins: [
    makeDeprecatedComponentMixin(
      'Use <RexWidget.Forms.ConfigurableEntityForm /> instead',
      'RexWidget.Forms.ConfigurableForm')
  ],

  render() {
    return <ConfigurableEntityForm {...this.props} ref="form" />;
  },

  submit() {
    this.refs.form.submit();
  }
});

module.exports = ConfigurableForm;
