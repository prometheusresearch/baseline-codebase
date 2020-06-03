/**
 * Use reactive params backed by URL query string.
 *
 * @flow
 */

import * as React from "react";
import * as ReactRouter from "react-router";
import * as qs from "query-string";

export type Params = {
  [name: string]: Value,
};

export type Value = any;

type Config = {|
  /**
   * Namespace used to construct a prefix for URL query params, for example
   * specifying `patients` will produce UEL query params like `patients:search`
   * in URL.
   */
  namespace?: ?string,

  /**
   * Initial parameters value.
   */
  initialParams?: ?Params,
|};

/**
 * Initialize React state for `Params` which syncs with URL query string
 * parameters.
 */
export default function useParams({
  namespace,
  initialParams,
}: Config): [Params, ((Params) => Params) => void] {
  let history = ReactRouter.useHistory();
  let [params, setParams] = React.useState<Params>(
    (() => {
      let params = initialParams;
      if (namespace != null) {
        params = {...params, ...parseParams(namespace, history.location)}
      }
      return params ?? {};
    }: () => Params),
  );

  // Listen for location updates
  React.useEffect(() => {
    if (namespace != null) {
      return history.listen(location => {
        let nextParams = parseParams(namespace, location);
        setParams(
          (params => {
            if (!eqParams(params, nextParams)) {
              return nextParams;
            } else {
              return params;
            }
          }: Params => Params),
        );
      });
    }
  }, [namespace, history]);

  // Update location with new params
  React.useEffect(() => {
    if (namespace == null) {
      return;
    }
    let prefix = `${namespace}${SEP}`;
    let q = qs.parse(history.location.search);

    // clear all params we "own" first
    // eslint-disable-next-line no-unused-vars
    for (let k in q) {
      if (k.startsWith(prefix)) {
        delete q[k];
      }
    }

    // populate "own" params
    // eslint-disable-next-line no-unused-vars
    for (let k in params) {
      let v = params[k];
      if (v != null) {
        q[`${namespace}${SEP}${k}`] = (v: any);
      }
    }

    let search = qs.stringify(q, { skipNull: true });
    if (search === "") {
      history.replace(history.location.pathname);
    } else {
      if (history.location.search !== `?${search}`) {
        history.replace(`${history.location.pathname}?${search}`);
      }
    }
  }, [namespace, history, params]);

  return [params, setParams];
}

function parseParams(namespace: string, location): Params {
  let prefix = `${namespace}${SEP}`;
  let q = qs.parse(location.search, {
    parseNumbers: true,
    parseBooleans: true,
  });

  let params = {};
  // eslint-disable-next-line no-unused-vars
  for (let k in q) {
    let v = q[k];
    if (k.startsWith(prefix)) {
      k = k.slice(prefix.length);
      params[k] = v;
    }
  }

  return params;
}

function eqParams(a: Params, b: Params): boolean {
  let akeys = Object.keys(a);
  let bkeys = Object.keys(a);
  if (akeys.length !== bkeys.length) {
    return false;
  }
  // eslint-disable-next-line no-unused-vars
  for (let k of akeys) {
    if (a[k] !== b[k]) {
      return false;
    }
  }
  return true;
}

// This should be some URL friendly character, '.' is fine.
const SEP = ".";
