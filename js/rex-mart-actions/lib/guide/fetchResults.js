/**
 * @copyright 2017, Prometheus Research, LLC
 * @flow
 */

import * as Types from './types';
// $FlowFixMe: update rex.widget typings
import {request} from 'rex-widget/data';

export function fetchResults(
  url: string,
  params: Types.FetchResultsParams,
): Promise<Response> {
  const options = {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: params.mimeType,
    },
    body: prepareFetchParams(params),
  };
  return fetch(url, options);
}

type FetchParamsState = {
  columnState: Types.ColumnState,
  filterState: Types.FilterState,
  sortState: Types.SortState,
  limit?: number,
  offset?: number,
};

export function prepareFetchParams(state: FetchParamsState) {
  const columns = state.columnState
    .map((col, idx) => (col ? idx : -1))
    .filter(col => col >= 0);
  const params = JSON.stringify({
    columns,
    filters: state.filterState,
    sort: state.sortState,
    limit: state.limit,
    offset: state.offset,
  });
  return params;
}

export default fetchResults;
