/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {WithFormValue} from 'react-forms';
import CloseIcon from 'react-icons/lib/fa/close';

import {autobind} from '../../lang';
import {HBox, VBox} from '../../layout';
import {DangerButton, Button} from '../../ui';
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
      marginTop: 20,
    },
    Label: {
      Component: 'label',
      color: '#000',
      fontSize: '100%',
      fontWeight: 700,
      marginTop: 15,
      marginBottom: 15,
    },
    ErrorList: {
      Component: HBox,
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
      marginBottom: 9,
    },
    ItemToolbar: {
      marginBottom: 14,
      marginRight: 21,
      alignSelf: 'flex-end',
    }
  });

  render() {
    let {
      children, formValue, label, readOnly,
      addButtonText, removeButtonText, layout , ...props
    } = this.props;
    let {Root, Label, ErrorList, Item, ItemToolbar, Required} = this.constructor.stylesheet;
    let schema = formValue.schema || {};
    let items = formValue.value || [];
    let fieldsets = items.map((item, idx) => {
      let content;
      if (layout === 'vertical') {
        content = (
          <VBox>
            {!readOnly &&
              <ItemToolbar>
                <DangerButton
                  size="small"
                  icon={<CloseIcon />}
                  onClick={this.removeItem.bind(null, idx)}>
                  {removeButtonText}
                </DangerButton>
              </ItemToolbar>}
            {children}
          </VBox>
        );
      } else {
        content = (
          <HBox>
            {children}
            {!readOnly &&
              <ItemToolbar>
                <DangerButton
                  size="small"
                  icon={<CloseIcon />}
                  onClick={this.removeItem.bind(null, idx)}>
                  {removeButtonText}
                </DangerButton>
              </ItemToolbar>}
          </HBox>
        );
      }
      return (
        <Fieldset formValue={formValue.select(idx)} key={idx}>
          <Item>{content}</Item>
        </Fieldset>
      );
    });
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
            <Button icon="plus" size="normal" onClick={this.addItem} style={{marginTop: 20}}>
              {addButtonText} {label}
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
        defaultValue = formValue.schema.defaultItem || {};
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
