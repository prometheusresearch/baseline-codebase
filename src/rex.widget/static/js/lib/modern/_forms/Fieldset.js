/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react/addons');
var cloneWithProps  = React.addons.cloneWithProps;
var mapElement      = require('./mapElement');

var Fieldset = React.createClass({

  render() {
    var {children, component: Component, ...props} = this.props;
    children = mapElement(children, this._propagateFormValue);
    return <Component>{children}</Component>;
  },

  getDefaultProps() {
    return {
      component: 'div'
    };
  },

  _propagateFormValue(element) {
    if (element && element.props && element.props.selectFormValue) {
      var formValue = this.props.formValue;
      if (typeof element.props.selectFormValue === 'string') {
        formValue = formValue.select(element.props.selectFormValue);
      }
      element = cloneWithProps(element, {formValue});
    }
    return element;
  }
});

module.exports = Fieldset;
