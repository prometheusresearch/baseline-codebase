/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from "react";
import MaskedInputBase from "react-input-mask";

export default class MaskedInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: props.value };
  }

  render() {
    let { value } = this.state;
    if (value == null) {
      value = "";
    }
    return (
      <MaskedInputBase {...this.props} value={value} onChange={this.onChange} />
    );
  }

  componentWillReceiveProps({ value }) {
    if (value != null && value !== this.props.value) {
      this.setState({ value });
    }
  }

  onChange = e => {
    let value = e.target.value;
    if (value === "") {
      value = null;
    }
    if (value === placeholderFromMask(this.props.mask)) {
      this.props.onChange(null);
    } else {
      this.props.onChange(value);
    }
    this.setState({ value });
  };
}

function placeholderFromMask(mask) {
  return mask.replace(/[a9\*]/g, "_");
}
