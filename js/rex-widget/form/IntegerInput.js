/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import tryParseInt from "../tryParseInt";
import { Input, type Props as InputProps } from "./Input";

type Props = {|
  ...InputProps,
  onChange: (?(string | number)) => void
|};

export default class IntegerInput extends React.Component<Props> {
  render() {
    return <Input {...this.props} type="text" onChange={this.onChange} />;
  }

  onChange = (value: ?string) => {
    if (value === "") {
      this.props.onChange(undefined);
    } else {
      // $FlowFixMe: ...
      value = tryParseInt(value);
      this.props.onChange(value);
    }
  };
}
