/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow strict
 */

export let coerceMaybeEventToValue = (e: Event | mixed) => {
  let value;
  if (
    e != null &&
    e.target != null &&
    typeof e.target === "object" &&
    "value" in e.target
  ) {
    // $FlowFixMe: ...
    e.stopPropagation();
    // $FlowFixMe: ...
    let v = e.target.value;
    if (v === "") {
      v = null;
    }
    return v;
  } else {
    return (e: mixed);
  }
};
