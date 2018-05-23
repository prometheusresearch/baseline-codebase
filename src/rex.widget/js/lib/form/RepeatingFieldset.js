/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as React from 'react';
import {PropTypes} from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {HBox, VBox} from '@prometheusresearch/react-ui';
import {withFormValue} from 'react-forms';

import * as Theme from '../Theme';
import choose from '../choose';
import {Icon} from '../../ui';
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
    defaultValue: PropTypes.any,
  };

  static defaultProps = {
    addButtonText: 'Add',
  };

  render() {
    let {
      children,
      formValue,
      label,
      hint,
      readOnly,
      addButtonText,
      removeButtonText,
      layout,
      ...props
    } = this.props;
    let schema = formValue.schema || {};
    let items = formValue.value || [];
    let fieldsets = items.map((item, idx) => {
      const toolbar = (
        <RepeatingFieldsetItemToolbar onRemove={this.removeItem.bind(null, idx)}>
          {removeButtonText}
        </RepeatingFieldsetItemToolbar>
      );
      const content =
        layout === 'vertical' ? (
          <VBox>
            {!readOnly && toolbar} {children}
          </VBox>
        ) : (
          <HBox>
            {children} {!readOnly && toolbar}
          </HBox>
        );
      return (
        <Fieldset formValue={formValue.select(idx)} key={idx}>
          <VBox paddingBottom={10}>{content}</VBox>
        </Fieldset>
      );
    });
    const verticalFieldSpacing = choose(
      Theme.form.verticalFieldSpacing,
      Theme.form.condensedLayout ? 0 : null,
      10,
    );
    const horizontalFieldSpacing = choose(
      Theme.form.horizontalFieldSpacing,
      Theme.form.condensedLayout ? 0 : null,
      20,
    );
    return (
      <VBox
        marginBottom={verticalFieldSpacing}
        marginTop={verticalFieldSpacing}
        paddingLeft={horizontalFieldSpacing}
        paddingRight={horizontalFieldSpacing}>
        <FieldsetHeader
          label={label}
          hint={hint}
          isRequired={schema && schema.isRequired}
        />
        <VBox>{fieldsets}</VBox>
        {formValue.errorList.length > 0 && <ErrorList errorList={formValue.errorList} />}
        {!readOnly && (
          <ReactUI.Element paddingTop={10}>
            <ReactUI.Button
              icon={<Icon name="plus" />}
              size="small"
              onClick={this.addItem}>
              {addButtonText} {label}
            </ReactUI.Button>
          </ReactUI.Element>
        )}
      </VBox>
    );
  }

  addItem = () => {
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
  };

  removeItem = idx => {
    let {formValue} = this.props;
    let value = (formValue.value || []).slice(0);
    value.splice(idx, 1);
    formValue.update(value);
  };
}

export function RepeatingFieldsetItemToolbar({onRemove, children}) {
  return (
    <VBox marginBottom={35} marginRight={20} alignSelf="flex-start">
      <ReactUI.FlatDangerButton
        size="small"
        icon={<Icon name="remove" />}
        onClick={onRemove}>
        {children}
      </ReactUI.FlatDangerButton>
    </VBox>
  );
}

export default withFormValue(RepeatingFieldset);
