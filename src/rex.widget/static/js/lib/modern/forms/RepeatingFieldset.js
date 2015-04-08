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
  }
};

var RepeatingFieldset = React.createClass({

  getDefaultProps() {
    return {
      addButtonText: 'Add',
    };
  },

  render() {
    var {children, formValue, addButtonText,
      removeButtonText, ...props} = this.props;
    var items = formValue.value || [];
    var fieldsets = items.map((item, idx) =>
      <Fieldset formValue={formValue.select(idx)} key={idx}>
        <HBox>
          <VBox style={{marginRight: 10}}>
            <Button
              quiet
              size="small"
              icon="remove"
              text={removeButtonText}
              onClick={this.removeItem.bind(null, idx)}/>
          </VBox>
          <VBox size={1}>
            {children}
          </VBox>
        </HBox>
      </Fieldset>
    );
    return (
      <VBox>
        <VBox>
          {fieldsets}
        </VBox>
        {formValue.errors &&
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
    value.push(this.props.defaultValue);
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

module.exports = RepeatingFieldset;
