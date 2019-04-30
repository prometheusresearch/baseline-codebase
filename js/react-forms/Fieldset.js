/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow strict
 */

import * as React from "react";
import Component from "./Component";
import type {select, value} from "./types";

type Props = {
  select?: select,
  formValue?: value,
  children: React.Node,
};

export default class Fieldset extends React.Component<Props> {
  render() {
    let {select, formValue, children} = this.props;
    let render = _params => {
      return children;
    };
    return <Component children={render} formValue={formValue} select={select} />;
  }
}
