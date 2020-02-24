/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import { Input } from "./Input";
import tryParseFloat from "../tryParseFloat";
import type { InputProps } from "./Field.js";

type Props = {|
  ...InputProps,
  value: string,
  onChange: (?(number | string)) => void
|};

type State = {|
  value: ?string
|};

export default class NumberInput extends React.Component<Props, State> {
  static defaultProps = {
    value: ""
  };

  constructor(props: Props) {
    super(props);
    this.state = { value: props.value };
  }

  render() {
    return (
      <Input
        {...this.props}
        value={this.state.value}
        onChange={this.onChange}
      />
    );
  }

  componentWillReceiveProps(nextProps: Props) {
    let { value } = this.state;
    if (nextProps.value === undefined) {
      this.setState({ value: "" });
      // $FlowFixMe: ...
    } else if (nextProps.value !== tryParseFloat(value)) {
      this.setState({ value: String(nextProps.value) });
    }
  }

  onChange = (value: ?string) => {
    this.setState({ value }, () => {
      if (value === "") {
        this.props.onChange(undefined);
      } else {
        // $FlowFixMe: ...
        this.props.onChange(tryParseFloat(value));
      }
    });
  };
}
