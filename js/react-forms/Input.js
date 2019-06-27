/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import debounce from "lodash/debounce";
import noop from "lodash/noop";

export type Props = {
  Component: React.ElementType,
  debounce: number,
  value: string | null,
  onChange: (string | null) => void,
};

type State = {
  value: string | null,
};

/**
 * Input component with debounce.
 */
export default class Input extends React.Component<Props, State> {
  static defaultProps = {
    Component: "input",
    debounce: 100,
    onChange: noop,
    onBlur: noop,
  };

  _expectedValue: ?string;
  _finalizeOnChangeDebounced: {
    cancel?: () => void,
    (): void;
  };

  constructor(props: Props) {
    super(props);
    this.state = {value: props.value};
    this._expectedValue = undefined;
    this._finalizeOnChangeDebounced = props.debounce
      ? debounce(this._finalizeOnChange.bind(this), props.debounce)
      : this._finalizeOnChange.bind(this);
  }

  render() {
    let {
      Component,
      debounce: debounceEnabled,
      value,

      ...props
    } = this.props;
    if (debounceEnabled) {
      value = this.state.value;
    }
    if (value == null) {
      value = "";
    }
    return (
      // $FlowFixMe: ...
      <Component {...props} value={value} onChange={this.onChange} onBlur={this.onBlur} />
    );
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.value !== this._expectedValue) {
      if (nextProps.value !== this.props.value) {
        this._cancelOnChange();
        this.setState({value: nextProps.value});
      }
    }
    if (nextProps.debounce !== this.props.debounce) {
      this._finalizeOnChange();
      this._cancelOnChange();
      this._finalizeOnChangeDebounced = nextProps.debounce
        ? debounce(this._finalizeOnChange.bind(this), nextProps.debounce)
        : this._finalizeOnChange.bind(this);
    }
  }

  componentWillUnmount() {
    this._finalizeOnChange();
    this._cancelOnChange();
  }

  _scheduleOnChange(value: null | string) {
    this.setState({value});
    this._expectedValue = value;
    this._finalizeOnChangeDebounced();
  }

  _finalizeOnChange() {
    if (this._expectedValue !== undefined) {
      let value = this._expectedValue;
      this._expectedValue = undefined;
      this.props.onChange(value);
    }
  }

  _cancelOnChange() {
    if (this._finalizeOnChangeDebounced.cancel) {
      this._expectedValue = undefined;
      this._finalizeOnChangeDebounced.cancel();
    }
  }

  onChange = (e: Event | string | null) => {
    let value;
    // $FlowFixMe: ...
    if (e && e.target && "value" in e.target) {
      // $FlowFixMe: ...
      value = e.target.value;
      if (value === "") {
        value = null;
      }
    } else {
      value = e;
    }
    // $FlowFixMe: ...
    this._scheduleOnChange(value);
  };

  onBlur = (e: Event) => {
    // $FlowFixMe: ...
    if (this.props.onBlur) {
      this.props.onBlur(e);
    }
    if (this._expectedValue !== undefined) {
      this._finalizeOnChange();
      this._cancelOnChange();
    }
  };
}
