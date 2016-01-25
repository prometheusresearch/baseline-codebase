/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {autobind} from '../../lang';
import {VBox, HBox} from '../../layout';
import {QuietButton, Button} from '../../ui';
import * as Stylesheet from '../../stylesheet';
import Fieldset from './Fieldset';
import {WithFormValue} from 'react-forms';

/**
 * RepeatingFieldset component.
 *
 * This component renders a fieldset multiple times for each item in an array.
 *
 * @public
 */
@WithFormValue
@Stylesheet.attach
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

  static stylesheet = Stylesheet.create({
    Root: {
      Component: VBox,
      marginBottom: 15,
      marginTop: 15,
    },
    Label: {
      Component: 'label',
      color: '#666',
      fontSize: '90%',
      fontWeight: 700,
      margin: 0,
      marginBottom: 15,
    },
    ErrorList: {
      Component: VBox,
      marginTop: 10,
      marginBottom: 10,
      color: 'red',
      fontSize: '80%'
    },
    Required: {
      Component: 'span',
      color: 'red',
      marginLeft: 3,
      width: 5,
      display: 'inline-block',
    },
    Item: {
      Component: VBox,
      marginBottom: 5,
    },
    ItemToolbar: {
      marginBottom: 5,
      alignSelf: 'flex-end',
    }
  });

  render() {
    let {
      baseIndex, children, formValue, label, readOnly,
      addButtonText, removeButtonText, ...props
    } = this.props;
    let {Root, Label, ErrorList, Item, ItemToolbar, Required} = this.stylesheet;
    let schema = formValue.schema || {};
    let minItems = schema.minItems || 0;
    let items = formValue.value || [];
    if (baseIndex) {
      items = items.slice(baseIndex);
    }
    if (items.length < minItems) {
      items = items.concat(arrayFromLength(minItems - items.length));
    }
    let fieldsets = items.map((item, idx) =>
      <Fieldset formValue={formValue.select(idx + baseIndex)} key={idx + baseIndex}>
        <Item>
          {!readOnly &&
            <ItemToolbar>
              <QuietButton
                quiet
                size="small"
                icon="remove"
                style={{visibility: items.length > minItems ? undefined : 'hidden'}}
                onClick={this.removeItem.bind(null, idx + baseIndex)}>
                {removeButtonText}
              </QuietButton>
            </ItemToolbar>}
            <VBox flex={1}>
              {children}
            </VBox>
        </Item>
      </Fieldset>
    );
    return (
      <Root>
        {label &&
          <Label>
            {label}
            <Required>{schema && schema.isRequired ? '*' : null}</Required>
          </Label>}
        <VBox>
          {fieldsets}
        </VBox>
        {formValue.errorList.length > 0 &&
          <ErrorList>
            {formValue.errorList.map((error, idx) =>
              <VBox key={idx}>{error.message}</VBox>)}
          </ErrorList>}
        {!readOnly &&
          <div>
            <Button icon="plus" size="small" onClick={this.addItem}>
              {addButtonText}
            </Button>
          </div>}
      </Root>
    );
  }

  get value() {
    let {schema = {}, value = []} = this.props.formValue;
    let minItems = schema.minItems || 0;
    if (value.length < minItems) {
      value = value.concat(
        arrayFromLength(minItems - value.length,
        this.props.defaultValue));
    }
    return value;
  }

  @autobind
  addItem() {
    let {formValue} = this.props;
    let value = this.value.slice(0);
    console.log(value);
    let defaultValue = this.props.defaultValue;
    if (defaultValue === undefined) {
      defaultValue = formValue.schema.defaultItem;
    }
    value.push(defaultValue);
    formValue.update(value);
  }

  @autobind
  removeItem(idx) {
    let {formValue} = this.props;
    let value = this.value.slice(0);
    value.splice(idx, 1);
    formValue.update(value);
  }
}

function arrayFromLength(length, value = undefined) {
  let result = [];
  for (let i = 0; i < length; i++) {
    result.push(value);
  }
  return result;
}

module.exports = RepeatingFieldset;
