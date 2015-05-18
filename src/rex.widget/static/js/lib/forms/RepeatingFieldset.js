/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React         = require('react/addons');
var {VBox, HBox}  = require('../Layout');
var Button        = require('../Button');
var Fieldset      = require('../_forms/Fieldset');

var RepeatingFieldsetStyle = {
  errors: {
    marginTop: 3,
    color: 'red',
    fontSize: '90%'
  },
  label: {
    marginBottom: 10
  }
};

var RepeatingFieldset = React.createClass({

  getDefaultProps() {
    return {
      addButtonText: 'Add',
    };
  },

  render() {
    var {
      children, formValue, label,
      addButtonText, removeButtonText, ...props
    } = this.props;
    var minItems = formValue.schema.minItems || 0;
    var items = formValue.value || [];
    if (items.length < minItems) {
      items = items.concat(arrayFromLength(minItems - items.length));
    }
    var fieldsets = items.map((item, idx) =>
      <Fieldset formValue={formValue.select(idx)} key={idx}>
        <HBox>
          <VBox style={{marginRight: 10}}>
            <Button
              quiet
              size="small"
              icon="remove"
              style={{visibility: items.length > minItems ? undefined : 'hidden'}}
              text={removeButtonText}
              onClick={this.removeItem.bind(null, idx)}
              />
          </VBox>
          <VBox size={1}>
            {children}
          </VBox>
        </HBox>
      </Fieldset>
    );
    return (
      <VBox>
        {label &&
          <label style={RepeatingFieldsetStyle.label}>
            {label}
          </label>}
        <VBox>
          {fieldsets}
        </VBox>
        {formValue.errors.length > 0 &&
          <VBox style={RepeatingFieldsetStyle.errors}>
            {formValue.errors.map((error, idx) =>
              <VBox key={idx}>{error.message}</VBox>)}
          </VBox>}
        <VBox>
          <Button quiet icon="plus" onClick={this.addItem}>
            {addButtonText}
          </Button>
        </VBox>
      </VBox>
    );
  },

  addItem() {
    var {formValue} = this.props;
    var value = formValue.value ?
      formValue.value.slice(0) :
      [];
    var defaultValue = this.props.defaultValue;
    if (defaultValue === undefined) {
      defaultValue = formValue.schema.defaultItem;
    }
    value.push(defaultValue);
    formValue.set(value);
  },

  removeItem(idx) {
    var {formValue} = this.props;
    var value = formValue.value ?
      formValue.value.slice(0) :
      [];
    value.splice(idx, 1);
    formValue.set(value);
  }
});

function arrayFromLength(length) {
  var result = [];
  for (var i = 0; i < length; i++) {
    result.push(undefined);
  }
  return result;
}

module.exports = RepeatingFieldset;
