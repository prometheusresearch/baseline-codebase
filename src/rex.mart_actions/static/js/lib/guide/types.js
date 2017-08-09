/**
 * @flow
 */

import * as Charting from 'rex-query/src/charting/types';

export type Config = {
  filters: Array<mixed>,
  fields: Array<ColumnSpec>,
};

/**
 * A chart along with its title and unique id.
 */
export type ChartSpec = {|
  id: string,
  label: ?string,
  chart: Charting.Chart,
|};

export type SortSpec = {|
  id: string,
  dir: 'asc' | 'desc',
|};

export type SortState = Array<SortSpec>;

export type ColumnState = Array<boolean>;

export type FilterState = Array<mixed>;

export type ColumnSpec = {|
  title: string,
  selected: boolean,
  type: string,
|};

export type Exporter = {|
  name: string,
  title: string,
  mime_type: string,
|};

export type FetchResultsParams = {
  mimeType: string,
  columnState: ColumnState,
  filterState: FilterState,
  sortState: SortState,
  limit?: number,
  offset?: number,
};

export type Chart = Charting.Chart;
export type PieChart = Charting.PieChart;
export type LineChart = Charting.LineChart;
export type BarChart = Charting.BarChart;
export type ScatterChart = Charting.ScatterChart;
export type AreaChart = Charting.AreaChart;

export type ChartType = Charting.ChartType;

export type HTSQLProduct = {
  meta: HTSQLMeta,
  data: HTSQLData,
};

export type HTSQLMeta = HTSQLField;

export type HTSQLData = mixed;

export type HTSQLField = {
  domain: HTSQLDomain,
  header: string,
};

export type HTSQLDomain = HTSQLListDomain | HTSQLRecordDomain | HTSQLScalarDomain;

export type HTSQLListDomain = {
  type: 'list',
  item: {domain: HTSQLDomain},
};

export type HTSQLRecordDomain = {
  type: 'record',
  fields: Array<HTSQLField>,
};

export type HTSQLScalarDomain = {
  type: string,
};
