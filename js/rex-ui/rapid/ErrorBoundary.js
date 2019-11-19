/**
 * @flow
 */

import * as React from "react";
import Paper from "@material-ui/core/Paper";

export class ConfigError extends Error {}

type Props = {| children?: React.Node |};
type State = {|
  error: ?ConfigError,
|};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error: Error | ConfigError) {
    if (error instanceof ConfigError) {
      this.setState({ error });
    } else {
      throw error;
    }
  }

  render() {
    if (this.state.error != null) {
      return (
        <Paper style={{ padding: 16 }}>
          <h3>Something went wrong: {this.state.error.message}</h3>
        </Paper>
      );
    }

    return this.props.children || null;
  }
}
