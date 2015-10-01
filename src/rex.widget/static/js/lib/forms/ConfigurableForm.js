/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

let React                           = require('react');
let ConfigurableEntityForm          = require('./ConfigurableEntityForm');
let {makeDeprecatedComponentMixin}  = require('../DeprecatedComponent');


/**
 *  ConfigurableForm component.
 *
 * Use <RexWidget.Forms.ConfigurableEntityForm /> instead.
 *
 * @deprecated
 * @public
 */
let ConfigurableForm = React.createClass({
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
