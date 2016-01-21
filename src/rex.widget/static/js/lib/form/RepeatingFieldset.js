/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind           from 'autobind-decorator';
import React, {PropTypes} from 'react';
import {VBox, HBox}       from '../Layout';
import Button             from '../Button';
import Fieldset           from './Fieldset';
import {WithFormValue}    from 'react-forms';

let RepeatingFieldsetStyle = {
  errors: {
    marginTop: 3,
    color: 'red',
    fontSize: '90%'
  },
  label: {
    marginBottom: 10
  }
};

/**
 * RepeatingFieldset component.
 *
 * This component renders a fieldset multiple times for each item in an array.
 *
 * @public
 */
@WithFormValue
export default class RepeatingFieldset extends React.Component {

  static propTypes = {
    /**
     * The starting index for the data array in formValue
     */
    baseIndex: PropTypes.number,
    /**
     * The data to display.
     */
    formValue: PropTypes.object,

    /**
     * The label.
     */
    label: PropTypes.string,

    /**
     * The read-only flag.
     */
    readOnly: PropTypes.bool,

    /**
     * The text of the Add Button.
     */
    addButtonText: PropTypes.string,

    /**
     * The text of the Remove Button.
     */
    removeButtonText: PropTypes.string,

    /**
     * Children
     */
    children: PropTypes.node,

    /**
     * Default value for a new item.
     */
    defaultValue: PropTypes.any
  };

  static defaultProps = {
    baseIndex: 0,
    addButtonText: 'Add',
  };

  render() {
    let {
      baseIndex, children, formValue, label, readOnly,
      addButtonText, removeButtonText, ...props
    } = this.props;
    let minItems = formValue.schema.minItems || 0;
    let items = (formValue.value || []).slice(baseIndex);
    if (items.length < minItems) {
      items = items.concat(arrayFromLength(minItems - items.length));
    }
    let fieldsets = items.map((item, idx) =>
      <Fieldset formValue={formValue.select(idx + baseIndex)} key={idx + baseIndex}>
        <HBox>
        {!readOnly && <VBox style={{marginRight: 10}}>
            <Button
              quiet
              size="small"
              icon="remove"
              style={{visibility: items.length > minItems ? undefined : 'hidden'}}
              text={removeButtonText}
              onClick={this.removeItem.bind(null, idx + baseIndex)}
              />
          </VBox>}
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
        {formValue.errorList.length > 0 &&
          <VBox style={RepeatingFieldsetStyle.errors}>
            {formValue.errorList.map((error, idx) =>
              <VBox key={idx}>{error.message}</VBox>)}
          </VBox>}
        {!readOnly && <VBox>
          <Button quiet icon="plus" onClick={this.addItem}>
            {addButtonText}
          </Button>
        </VBox>}
      </VBox>
    );
  }

  @autobind
  addItem() {
    let {formValue} = this.props;
    let value = formValue.value ?
      formValue.value.slice(0) :
      [];
    let defaultValue = this.props.defaultValue;
    if (defaultValue === undefined) {
      defaultValue = formValue.schema.defaultItem;
    }
    value.push(defaultValue);
    formValue.set(value);
  }

  @autobind
  removeItem(idx) {
    let {formValue} = this.props;
    let value = formValue.value ?
      formValue.value.slice(0) :
      [];
    value.splice(idx, 1);
    formValue.set(value);
  }
}

function arrayFromLength(length) {
  let result = [];
  for (let i = 0; i < length; i++) {
    result.push(undefined);
  }
  return result;
}

module.exports = RepeatingFieldset;
