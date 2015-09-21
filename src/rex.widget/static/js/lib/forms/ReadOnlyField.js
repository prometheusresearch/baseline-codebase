/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var {VBox, HBox}  = require('../Layout');
var emptyFunction = require('../emptyFunction');

var Style = {
  self: {
    marginBottom: 2,
    marginTop: 2,
    fontSize: '90%'
  },
  label: {
    textAlign: 'right',
    color: '#666',
    padding: '2px 7px',
    margin: 0
  }
};

/**
 * Renders a read-only field as an <HBox> 
 * with a <VBox> containing the ``label``,
 * and another <VBox> containing the value.
 * The value is ``children`` unless ``children === undefined`` 
 * in which case ``formValue.value`` is used. 
 *
 * @public
 */
var ReadOnlyField = React.createClass({

  propTypes: {
    /**
     * The field label.
     */
    label: React.PropTypes.string,
    
    /**
     * css style object.
     */
    style: React.PropTypes.object,

    /**
     * func
     *
     * This function is used to convert formValue.value to 
     * something renderable.  
     *
     * The default function returns the input unchanged
     * when it is null or an element, 
     * otherwise the input is converted to a String.
     * 
     */
    renderValue: React.PropTypes.func,
    
    /**
     * The initial value of the field.
     * @ask-andrey to please explain the properties of this object.  
     */
    formValue: React.PropTypes.object,

    /**
     * The input element to use.
     */
    children: React.PropTypes.element,
    
    /**
     * Unitless number representing the amount of space the 
     * <VBox> with the <label> uses
     * relative to all its sibling widgets.
     */
    labelSize: React.PropTypes.number,
    
    /**
     * Unitless number representing the amount of space the 
     * <VBox> with the value uses
     * relative to all its sibling widgets.
     */
    inputSize: React.PropTypes.number
  },

  render() {
    var {label, style, renderValue, formValue, children, labelSize, inputSize} = this.props;
    if (children === undefined) {
      children = renderValue(formValue.value);
    }
    return (
      <HBox style={{...Style.self, ...(style && style.self)}}>
        {label &&
          <VBox size={labelSize} centerVertically>
            <label style={{...Style.label, ...(style && style.label)}}>
              {label}
            </label>
          </VBox>}
        <VBox size={inputSize} centerVertically>
          {children}
        </VBox>
      </HBox>
    );
  },

  getDefaultProps() {
    return {
      renderValue: renderValue,
      labelSize: 2,
      inputSize: 5
    };
  }
});

function renderValue(value) {
  if (value == null) {
    return value;
  } else if (value.type && value.props) {
    return value;
  } else {
    return String(value);
  }
}

module.exports = ReadOnlyField;
