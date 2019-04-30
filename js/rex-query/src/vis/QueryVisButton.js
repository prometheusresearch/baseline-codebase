/**
 * @flow
 */

import * as React from "react";
import { VBox } from "react-stylesheet";

import QueryVisButtonHeader from "./QueryVisButtonHeader";

type QueryVisButtonStylesheet = {
  Root: React.ComponentType<*>,
  Button: React.ComponentType<*>
};

type QueryVisButtonProps = {
  children?: React.Node,
  stylesheet: QueryVisButtonStylesheet
};

export default class QueryVisButton extends React.Component<QueryVisButtonProps> {
  static defaultProps = {
    stylesheet: {
      Root: (VBox: any),
      Button: (VBox: any)
    }
  };

  render() {
    let { children, ...props } = this.props;
    return (
      <VBox>
        <QueryVisButtonHeader {...props} />
        {children}
      </VBox>
    );
  }
}
