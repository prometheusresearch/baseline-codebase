/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow strict
 */

import * as React from "react";
import FormComponent from "./Component";
import type { select, value } from "./types";

export type Props = {
  select?: select,
  formValue?: value
};

function getComponentDisplayName<T>(ComponentType: React.AbstractComponent<T>) {
  let displayName = "Component";
  if (ComponentType.displayName != null) {
    displayName = ComponentType.displayName;
  } else if (ComponentType.name != null) {
    displayName = ComponentType.name;
  }
  return displayName;
}

export function withFormValue<T: Props>(
  Component: React.AbstractComponent<T>
): React.AbstractComponent<$Diff<T, { formValue?: value }>> {
  let displayName = getComponentDisplayName(Component);

  return class extends React.Component<$Diff<T, { formValue?: value }>> {
    static displayName = `withFormValue(${displayName})`;

    render() {
      let { select, formValue, ...props } = this.props;
      let render = ({ formValue }) => (
        <Component {...props} formValue={formValue} />
      );
      return (
        <FormComponent
          select={select}
          formValue={formValue}
          children={render}
        />
      );
    }
  };
}

export default withFormValue;
