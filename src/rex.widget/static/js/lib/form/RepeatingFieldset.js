/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {WithFormValue} from 'react-forms';
import CloseIcon from 'react-icons/lib/fa/close';

import {autobind} from '../../lang';
import {VBox} from '../../layout';
import {QuietButton, Button} from '../../ui';
import * as Stylesheet from '../../stylesheet';
import Fieldset from './Fieldset';

/**
 * RepeatingFieldset component.
 *
 * This component renders a fieldset multiple times for each item in an array.
 *
 * @public
 */
export class RepeatingFieldset extends React.Component {

  static propTypes = {
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
      children, formValue, label, readOnly,
      addButtonText, removeButtonText, ...props
    } = this.props;
    let {Root, Label, ErrorList, Item, ItemToolbar, Required} = this.constructor.stylesheet;
    let schema = formValue.schema || {};
    let items = formValue.value || [];
    let fieldsets = items.map((item, idx) =>
      <Fieldset formValue={formValue.select(idx)} key={idx}>
        <Item>
          {!readOnly &&
            <ItemToolbar>
              <QuietButton
                quiet
                size="small"
                icon={<CloseIcon />}
                onClick={this.removeItem.bind(null, idx)}>
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

  @autobind
  addItem() {
    let {formValue} = this.props;
    let value = (formValue.value || []).slice(0);
    let defaultValue = this.props.defaultValue;
    if (defaultValue === undefined) {
      if (formValue.schema) {
        defaultValue = formValue.schema.defaultItem;
      } else {
        defaultValue = {};
      }
    }
    value.push(defaultValue);
    formValue.update(value);
  }

  @autobind
  removeItem(idx) {
    let {formValue} = this.props;
    let value = (formValue.value || []).slice(0);
    value.splice(idx, 1);
    formValue.update(value);
  }
}

export default WithFormValue(RepeatingFieldset);
