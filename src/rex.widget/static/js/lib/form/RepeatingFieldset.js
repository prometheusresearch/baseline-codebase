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
import {FieldsetHeader} from './ui';
import ErrorList from './ErrorList';

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
    Header: FieldsetHeader,
    ErrorList: ErrorList,
    Item: {
      Component: VBox,
      marginBottom: 9,
    },
    ItemToolbar: {
      marginTop: 35,
      marginRight: 21,
      alignSelf: 'flex-start',
    }
  });

  render() {
    let {
      children, formValue, label, hint, readOnly,
      addButtonText, removeButtonText, layout , ...props
    } = this.props;
    let {
      Root, Header, ErrorList,
      Item, ItemToolbar
    } = this.constructor.stylesheet;
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
        <Header
          label={label}
          hint={hint}
          isRequired={schema && schema.isRequired}
          />
        <VBox>
          {fieldsets}
        </VBox>
        {formValue.errorList.length > 0 &&
          <ErrorList errorList={formValue.errorList} />}
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
