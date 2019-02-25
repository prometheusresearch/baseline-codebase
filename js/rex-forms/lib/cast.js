 /**
  * @copyright 2016-present, Prometheus Research, LLC
  * @flow
  */

export default function cast<A, B>(value: A): B {
  let anyValue: any = value;
  let refValue: B = anyValue;
  return refValue;
}

/* TODO: what's this?
function cast<A, B>(value: A): B {
  let anyValue: any = value;
  let refValue: B = anyValue;
  return refValue;
}
*/
