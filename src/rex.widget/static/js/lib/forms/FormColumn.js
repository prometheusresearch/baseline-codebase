/**
 * @copyright 2015, Prometheus Research, LLC
 */

import  React, {PropTypes}  from 'react';
import  {VBox, HBox}        from '../Layout';
import  renderFormItem      from './renderFormItem';

export default class FormColumn extends React.Component {

  static propTypes = {
    /**
     * An array of field specifications to render.
     */
    fields: PropTypes.array,

    /**
     * Form value.
     */
    formValue: PropTypes.object,

    /**
     * A bag of props which should be passed to fields.
     */
    fieldProps: PropTypes.object,

    /**
     * Size of the row (bassed to underlying <HBox /> component).
     */
    size: PropTypes.number,
  };

  static defaultProps = {
    size: 1
  };

  render() {
    let {fields, size, formValue, fieldProps} = this.props;
    let items = fields.map((field, idx) =>
      renderFormItem(formValue, field, fieldProps, idx))
    return (
      <VBox size={size}>
        {items}
      </VBox>
    );
  }
}
