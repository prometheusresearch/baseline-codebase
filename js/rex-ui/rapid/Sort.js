// @flow

import type { Params } from "./useParams.js";

export type SortDirection = {|
  field: string,
  desc: boolean,
|};

export function setSort(params: Params, sort: ?SortDirection) {
  if (sort != null) {
    let v = `${sort.field}${SEP}${sort.desc ? "desc" : "asc"}`;
    return { ...params, [PARAM_NAME]: v };
  } else if (params[PARAM_NAME] != null) {
    params = { ...params };
    delete params[PARAM_NAME];
    return params;
  } else {
    return params;
  }
}

export function getSort(params: Params): ?SortDirection {
  let v = params[PARAM_NAME];
  return ofString(v);
}

export function toString(sort: ?SortDirection): ?string {
  if (sort != null) {
    return `${sort.field}${SEP}${sort.desc ? "desc" : "asc"}`;
  } else {
    return null;
  }
}

export function ofString(v: mixed): ?SortDirection {
  if (typeof v !== "string" || v === "") {
    return null;
  }
  let [field, descv] = v.split(SEP);
  let desc = false;
  if (descv === "desc") {
    desc = true;
  }
  return { field, desc };
}

export const PARAM_NAME = "sort";
const SEP = ".";
