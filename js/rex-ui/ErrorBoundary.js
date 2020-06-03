// @flow

import * as React from "react";

type Props = {|
  children: React.Node,
  renderOnError: React.Node,
|};

type State = {|
  hasError: boolean,
|};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.renderOnError;
    } else {
      return this.props.children;
    }
  }
}
