/**
 * @flow
 */

import invariant from "invariant";

export type Empty = true & false;

export function impossible(unhandled: Empty, message?: string) {
  if (message != null) {
    invariant("Impossible case happenned: %s", message);
  } else {
    invariant("Impossible case happenned");
  }
}
