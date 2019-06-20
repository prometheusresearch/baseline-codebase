/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow strict
 */

import * as React from "react";
import Component from "./Component";
import Error from "./Error";
import * as types from "./types";

type Props = {
  formValue: types.value,

  /**
   * If component should render errors from all the subvalues.
   */
  complete?: boolean,
  /**
   * Show errors.
   */
  hideNonForced: boolean,

  /**
   * Restrict schema types
   */
  schemaType?: { [name: string]: boolean },

  noLabel?: boolean,

  label?: string,

  errorComponent?: React.AbstractComponent<{|
    noLabel?: boolean,
    complete?: boolean,
    error: types.error,
  |}>,
};

function ErrorList(props: Props) {
  let {
    noLabel,
    hideNonForced,
    complete,
    schemaType,
    formValue,
    errorComponent,
    ...rest
  } = props;
  let errorList = Boolean(complete)
    ? formValue.completeErrorList
    : formValue.errorList;
  if (schemaType !== undefined) {
    errorList = errorList.filter(error =>
      error.schema ? schemaType[error.schema.type] : schemaType.none,
    );
  }
  if (hideNonForced) {
    errorList = errorList.filter(error => error.force);
  }
  if (errorList.length === 0) {
    return null;
  }
  let ErrorComponent = errorComponent != null ? errorComponent : Error;
  let items = errorList.map((error, index) => (
    <ErrorComponent
      key={error.field + "__" + index}
      error={error}
      noLabel={noLabel}
      complete={complete}
    />
  ));
  return <div {...rest}>{items}</div>;
}

export default ErrorList;
