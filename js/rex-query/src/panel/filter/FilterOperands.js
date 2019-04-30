/**
 * @flow
 */

import * as React from "react";
import Moment from "moment";
// $FlowFixMe: ...
import * as ReactUI from "@prometheusresearch/react-ui";
import { DateInput } from "rex-ui";
import debounce from "lodash/debounce";

import { Select, type SelectProps, type SelectOption } from "../../ui";

type TextOperandProps = {
  type?: string,
  value: ?string,
  onChange: (value: ?string) => *
};

export class TextOperand extends React.Component<
  TextOperandProps,
  { value: ?string }
> {
  state = { value: this.props.value };

  render() {
    let { value } = this.state;

    return (
      <ReactUI.Input
        {...this.props}
        type={undefined}
        value={value == null ? "" : value}
        onChange={this.onChange}
        placeholder="Enter a Value..."
      />
    );
  }

  onChange = (event: any) => {
    let target = event.target;
    let value = target.value || null;
    this.setState({ value });
    this.onChangeSchedule(target.value || null);
  };

  onChangeSchedule = debounce((text: ?string) => {
    this.props.onChange(text);
  }, 750);
}

type NumberOperandProps = {
  value: ?string,
  onChange: (value: number) => *
};

type NumberOperandState = {
  value: ?string,
  error: boolean
};

export class NumberOperand extends React.Component<
  NumberOperandProps,
  NumberOperandState
> {
  constructor(props: NumberOperandProps) {
    super(props);
    this.state = {
      value: props.value,
      error: false
    };
  }

  componentWillReceiveProps(nextProps: NumberOperandProps) {
    if (Number(nextProps.value) !== Number(this.state.value)) {
      this.setState({
        value: nextProps.value,
        error: false
      });
    }
  }

  render() {
    return (
      <TextOperand
        variant={{ error: this.state.error }}
        value={this.state.value}
        onChange={this.onChange}
      />
    );
  }

  onChange = (value: ?string) => {
    let num = Number(value);
    if (value != null && !Number.isNaN(num)) {
      this.setState({ value, error: false }, () => {
        this.onChangeSchedule(num);
      });
    } else {
      this.setState({ value, error: true });
    }
  };

  onChangeSchedule = debounce((n: number) => {
    this.props.onChange(n);
  }, 750);
}

type EnumerationOperandProps = SelectProps<SelectOption> & { value: ?string };

export class EnumerationOperand extends React.Component<EnumerationOperandProps> {
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

type DateOperandBaseState = {
  value: any,
  invalid: boolean
};

class DateOperandBase extends React.Component<*, DateOperandBaseState> {
  static format = "YYYY-MM-DD";

  constructor(props: any) {
    super(props);
    this.state = {
      invalid: false,
      value: props.value
    };
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.value !== this.props.value) {
      this.setState({
        value: nextProps.value,
        invalid: false
      });
    }
  }

  render() {
    let { value, invalid } = this.state;
    return (
      <ReactUI.Block>
        {this.renderField({ value, invalid, onChange: this.onChange })}
        {invalid && <ReactUI.ErrorText>Value is invalid</ReactUI.ErrorText>}
      </ReactUI.Block>
    );
  }

  renderField(props: {
    value: ?string,
    onChange: (?string, ?Moment) => void
  }): React.Node {
    return null;
  }

  onChange = (value: ?string, date: ?Moment) => {
    let seconds = Number(value);
    if (date == null) {
      this.setState({ value, invalid: value != null });
    } else {
      this.setState({ value, invalid: false });
      this.props.onChange(date.format(this.constructor.format));
    }
  };
}

export class DateOperand extends DateOperandBase {
  static format = "YYYY-MM-DD";

  renderField({
    value,
    onChange
  }: {
    value: any,
    onChange: (?string, ?Moment) => void
  }): React.Node {
    return <DateInput mode="date" value={value} onChange={onChange} />;
  }
}

export class TimeOperand extends DateOperandBase {
  static format = "HH:mm:ss";

  renderField({
    value,
    onChange
  }: {
    value: any,
    onChange: (?string, ?Moment) => void
  }): React.Node {
    return <DateInput mode="time" value={value} onChange={onChange} />;
  }
}

export class DateTimeOperand extends DateOperandBase {
  static format = "YYYY-MM-DD HH:mm:ss";

  renderField({
    value,
    onChange
  }: {
    value: any,
    onChange: (?string, ?Moment) => void
  }): React.Node {
    return <DateInput mode="time" value={value} onChange={onChange} />;
  }
}

export class MultiEnumerationOperand extends React.Component<EnumerationOperandProps> {
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
