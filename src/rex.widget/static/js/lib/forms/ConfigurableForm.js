/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var ConfigurableEntityForm          = require('./ConfigurableEntityForm');
var {makeDeprecatedComponentMixin}  = require('../DeprecatedComponent');


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
