/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import { Element } from "react-stylesheet";
import Action from "../Action";

type Props = {|
  width?: number,
  title?: string,
  text?: string
|};

export default class Page extends React.Component<Props> {
  static defaultProps = {
    width: 480,
    title: "Page",
    icon: "bookmark"
  };

  render() {
    let { width, title, text } = this.props;
    return (
      <Action title={title} width={width}>
        <Element padding={10} dangerouslySetInnerHTML={{ __html: text }} />
      </Action>
    );
  }
}
