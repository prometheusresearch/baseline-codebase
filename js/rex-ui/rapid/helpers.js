/**
 * @flow
 */
import invariant from "invariant";

export function capitalize(value: string) {
  if (value.length === 0) {
    return value;
  }
  return value[0].toUpperCase() + value.substring(1);
}

export const isEmptyObject = (obj: any) =>
  obj != null && typeof obj === "object" && Object.keys(obj).length === 0;
