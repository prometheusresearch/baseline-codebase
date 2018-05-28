/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';

import Field from './Field';
import ReadOnlyField from './ReadOnlyField';
import SourceCodeInput from './SourceCodeInput';


function renderReadOnlyValue(serializer, value) {
  return <pre style={{fontSize: '12px'}}>{value && serializer(value)}</pre>;
}


export default class SourceCodeField extends React.Component {
  static propTypes = {
    readOnly: React.PropTypes.bool,
  };

  static defaultProps = {
    serializer: (value) => value,
  };

  render() {
    let {readOnly, ...props} = this.props;
    let Input = this.props.input || SourceCodeInput;

    if (readOnly) {
      return (
        <ReadOnlyField
          {...props}
          renderValue={renderReadOnlyValue.bind(null, this.props.serializer)}
          />
      );
    } else {
      return (
        <Field {...props}>
          <Input />
        </Field>
      );
    }
  }
}

