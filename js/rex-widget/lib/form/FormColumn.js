/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes}  from 'react';
import {withFormValue}     from 'react-forms';
import {VBox}              from '@prometheusresearch/react-box';
import renderFormItem      from './renderFormItem';

export default withFormValue(class FormColumn extends React.Component {

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
    flex: PropTypes.number,
  };

  static defaultProps = {
    flex: 1
  };

  render() {
    let {fields, formValue, fieldProps, ...props} = this.props;
    let items = fields.map((field, idx) =>
      renderFormItem(formValue, field, fieldProps, idx));
    return (
      <VBox {...props}>{items}</VBox>
    );
  }
})
