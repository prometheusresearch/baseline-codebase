/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow strict
 */

import * as React from "react";
import invariant from "invariant";
import keyPath from "./keyPath";
import * as types from "./types";

export let Context = React.createContext<?types.value>(null);

export type Props = {
  select?: types.select,
  formValue?: types.value,
  children: ({formValue: types.value}) => React.Node,
};

function selectFormValue(formValue: types.value, select?: types.select): types.value {
  // We check for select !== true to keep compatability we eariler
  // versions of React Forms where we needed to rebuild element tree to
  // propagate values to form.
  if (select != null && select !== true) {
    return formValue.select(keyPath(select));
  } else {
    return formValue;
  }
}

/**
 * Base class for form components.
 *
 * It exposes form value via `this.formValue` which is provided either via
 * `this.props.formValue` or via context.
 */
export default class Component extends React.Component<Props> {
  static contextType = Context;

  formValue() {
    if (this.props.formValue != null) {
      return this.props.formValue;
    } else if (this.context != null) {
      return selectFormValue(this.context, this.props.select);
    } else {
      let name = "UnknownComponent";
      if (this.constructor.displayName != null) {
        name = this.constructor.displayName;
      } else if (this.constructor.name != null) {
        name = this.constructor.name;
      }
      throw new Error(
        "A form component <" +
          name +
          " /> should receive form value via props " +
          "or be used as a part of element hierarchy which " +
          "provides form value via context.",
      );
    }
  }

  render() {
    let formValue = this.formValue();
    return (
      <Context.Provider value={formValue}>
        {this.props.children({formValue})}
      </Context.Provider>
    );
  }
}

/**
 * Return the current form value in scope.
 */
export function useFormValue(
  formValue?: types.value,
  select?: types.select,
): types.value {
  const formValueOfContext = React.useContext(Context);

  if (formValue !== undefined) {
    return formValue;
  } else if (formValueOfContext != null) {
    return selectFormValue(formValueOfContext, select);
  } else {
    throw new Error(
      "A form component should receive form value via props " +
        "or be used as a part of element hierarchy which " +
        "provides form value via context.",
    );
  }
}
