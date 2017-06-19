/**
 * @flow
 */

import React from 'react';
import moment from 'moment';
import * as ReactUI from '@prometheusresearch/react-ui';

import {Select} from '../../ui';
import DateTimeField from '@prometheusresearch/react-datetimepicker';

type TextOperandProps = {
  type: string,
  value: string,
  onChange: (value: ?string) => *,
};

export class TextOperand extends React.Component<*, TextOperandProps, *> {
  render() {
    let {value, ...props} = this.props;
    return (
      <ReactUI.Input
        {...props}
        type={undefined}
        value={value == null ? '' : value}
        onChange={this.onChange}
        placeholder="Enter a Value..."
      />
    );
  }

  onChange = (event: any) => {
    let target = event.target;
    this.props.onChange(target.value || null);
  };
}

type NumberOperandProps = {
  value: string,
  onChange: (value: number) => *,
};

export class NumberOperand extends React.Component<*, NumberOperandProps, *> {
  state: {
    value: string,
    error: boolean,
  };

  constructor(props: NumberOperandProps) {
    super(props);
    this.state = {
      value: props.value,
      error: false,
    };
  }

  componentWillReceiveProps(nextProps: NumberOperandProps) {
    if (Number(nextProps.value) !== Number(this.state.value)) {
      this.setState({
        value: nextProps.value,
        error: false,
      });
    }
  }

  render() {
    return (
      <TextOperand
        variant={{error: this.state.error}}
        value={this.state.value}
        onChange={this.onChange}
      />
    );
  }

  onChange = (value: string) => {
    let num = Number(value);
    if (value != null && !Number.isNaN(num)) {
      this.setState({value, error: false}, () => {
        this.props.onChange(num);
      });
    } else {
      this.setState({value, error: true});
    }
  };
}

export class EnumerationOperand extends React.Component {
  render() {
    return (
      <Select
        value={this.props.value}
        options={this.props.options}
        onChange={this.props.onChange}
        placeholder="Select a Value..."
      />
    );
  }
}

class DateOperandBase extends React.Component {
  static format = 'YYYY-MM-DD';

  state: {
    value: any,
    invalid: boolean,
  };

  field: any;

  constructor(props: any) {
    super(props);
    this.state = {
      invalid: false,
      value: props.value ? moment(props.value) : null,
    };
  }

  componentWillReceiveProps(nextProps: any) {
    this.setState({
      value: nextProps.value ? moment(nextProps.value) : null,
      invalid: false,
    });
    // XXX: This is a workaround for <DateTimeField /> which doesn't not resets
    // its state correctly
    if (nextProps.value == null && this.field) {
      this.field.setState({inputValue: ''});
    }
  }

  render() {
    let {value, invalid} = this.state;
    return (
      <ReactUI.Block>
        {this.renderField({value, invalid, onChange: this.onChange})}
        {invalid && <ReactUI.ErrorText>Value is invalid</ReactUI.ErrorText>}
      </ReactUI.Block>
    );
  }

  renderField(props: {value: any, onChange: string => *}): ?React.Element<*> {
    return null;
  }

  onField = field => {
    this.field = field;
  };

  onChange = (value: string) => {
    let seconds = Number(value);
    if (Number.isNaN(seconds)) {
      this.setState({value, invalid: true});
    } else {
      this.props.onChange(moment(new Date(seconds)).format(this.constructor.format));
    }
  };
}

export class DateOperand extends DateOperandBase {
  static format = 'YYYY-MM-DD';

  renderField({value, onChange}: {value: any, onChange: string => *}): ?React.Element<*> {
    return (
      <DateTimeField
        ref={this.onField}
        mode="date"
        dateTime={value}
        onChange={onChange}
      />
    );
  }
}

export class TimeOperand extends DateOperandBase {
  static format = 'HH:mm:ss';

  renderField({value, onChange}: {value: any, onChange: string => *}): ?React.Element<*> {
    return (
      <DateTimeField
        ref={this.onField}
        mode="time"
        dateTime={value}
        onChange={onChange}
      />
    );
  }
}

export class DateTimeOperand extends DateOperandBase {
  static format = 'YYYY-MM-DD HH:mm:ss';

  renderField({value, onChange}: {value: any, onChange: string => *}): ?React.Element<*> {
    return (
      <DateTimeField
        ref={this.onField}
        mode="time"
        dateTime={value}
        onChange={onChange}
      />
    );
  }
}

export class MultiEnumerationOperand extends React.Component {
  render() {
    return (
      <Select
        multi={true}
        value={this.props.value}
        options={this.props.options}
        onChange={this.props.onChange}
        placeholder="Select Some Values..."
      />
    );
  }
}
