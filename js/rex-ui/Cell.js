// @flow

import { useEffect, useState } from "react";

/**
 * A non-React-ive mutable container with synchronous subscriptions.
 *
 * See useSubscription below on how to make this container React-ive.
 */
export type Cell<V> = {|
  +get: () => V,
  +set: (updater: (V) => V) => void,
  +subscribe: (() => void) => () => void,
  +useSubscription: <P>(
    project: (V) => P,
    dependendcies?: $ReadOnlyArray<mixed>,
    equal?: (P, P) => boolean,
  ) => P,
|};

/**
 * Initialize new Cell.
 *
 * Remember, it's not React-ive, the React component won't re-render when you
 * update Cell.
 */
export function create<V>(initialValue: V): Cell<V> {
  let value = initialValue;
  let subscriptions = new Set();
  let cell = {
    get: () => {
      return value;
    },
    set: (updater: V => V) => {
      value = updater(value);
      subscriptions.forEach(fn => {
        if (fn != null) {
          fn();
        }
      });
    },
    subscribe: fn => {
      subscriptions.add(fn);
      return () => {
        subscriptions.delete(fn);
      };
    },
    useSubscription: <P>(project: V => P, dependendcies, equal) =>
      useSubscription(cell, project, dependendcies, equal),
  };
  return cell;
}

/**
 * Subscripe for updates in a part of the Cell specified by project.
 */
export function useSubscription<V, P>(
  cell: Cell<V>,
  project: V => P,
  dependendcies?: $ReadOnlyArray<mixed> = [],
  equal?: (P, P) => boolean,
): P {
  let [state, setState] = useState(() => ({
    cell,
    value: project(cell.get()),
  }));

  let valueToReturn = state.value;

  if (state.cell !== cell) {
    valueToReturn = project(cell.get());
    setState({
      cell,
      value: valueToReturn,
    });
  }

  useEffect(
    () => {
      let didUnsubscribe = false;

      let checkForUpdates = () => {
        if (didUnsubscribe) {
          return;
        }

        setState(prevState => {
          if (prevState.cell !== cell) {
            return prevState;
          }

          let value = project(cell.get());

          if (equal != null) {
            if (equal(prevState.value, value)) {
              return prevState;
            }
          } else {
            if (prevState.value === value) {
              return prevState;
            }
          }

          return { ...prevState, value };
        });
      };

      let unsubscribe = cell.subscribe(checkForUpdates);
      checkForUpdates();

      return () => {
        didUnsubscribe = true;
        unsubscribe();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cell, ...dependendcies],
  );

  return valueToReturn;
}
