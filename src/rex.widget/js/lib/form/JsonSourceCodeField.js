/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';

import SourceCodeInput from './SourceCodeInput';
import SourceCodeField from './SourceCodeField';


class JsonInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.jsonify(props.value),
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      value: this.jsonify(nextProps.value),
    });
  }

  jsonify(value) {
    if (typeof value === 'string') {
      return value;
    } else if (value == null) {
      return '';
    } else {
      return JSON.stringify(value, null, 2);
    }
  }

  render() {
    return (
      <SourceCodeInput
        {...this.props}
        value={this.state.value}
        onChange={(value) => {
          if (!value) {
            value = null;
          }
          this.props.onChange(value);
        }}
        />
    );
  }
}


export default class JsonSourceCodeField extends React.Component {
  render() {
    return (
      <SourceCodeField
        {...this.props}
        input={JsonInput}
        serializer={(value) => JSON.stringify(value, null, 2)}
        />
    );
  }
}

