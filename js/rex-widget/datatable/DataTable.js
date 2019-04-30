/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import Fetch from "../data/Fetch";
import { useFetchWithHandle, type Fetcher, type DataSet } from "../data";
import DataTableBase, {
  type Row,
  type Pagination,
  type SortDirection
} from "./DataTableBase";

type Props = {|
  ...React.ElementConfig<typeof DataTableBase>,
  /**
   * Data fetch task.
   */
  data: Fetcher<Row[]>,

  /**
   * Pagination.
   */
  pagination?: Pagination,

  /**
   * Sorting.
   */
  sort?: SortDirection
|};

type Instance = {
  forceRefreshData: () => void
};

let DataTable = React.forwardRef<Props, ?Instance>((props: Props, ref) => {
  let {
    pagination: initialPagination = { top: 50, skip: 0 },
    sort: initialSort = { valueKey: null, asc: true },
    data,
    ...rest
  } = props;

  let [pagination, setPagination] = React.useState(initialPagination);
  let [sort, setSort] = React.useState(initialSort);

  // Build data query using current pagination and sort.
  data = data.limit(pagination.top, pagination.skip);
  if (sort && sort.valueKey) {
    data = data.sort(sort.valueKey, sort.asc);
  }

  // Fetch dataset
  //
  // We use useFetchWithHandle b/c we need to expose handle to consumers via
  // useImperativeHandle below.
  let [dataset, dataHandle] = useFetchWithHandle(data, {
    merge(prevDataset, dataset) {
      if (dataset.length !== 0) {
        dataset = dataset.setHasMore(true);
      }
      if (pagination.skip > 0 && prevDataset.data != null) {
        dataset = dataset.setData(prevDataset.data.concat(dataset.data));
      }
      return dataset;
    }
  });

  // So code can manipulate datatable state imperatively.
  React.useImperativeHandle(ref, () => {
    forceRefreshData: () => {
      dataHandle.refresh();
    };
  });

  let onSort = sort => {
    setSort(sort);
    // Reset pagination on sort
    setPagination(initialPagination);
  };

  let onPagination = pagination => {
    setPagination(pagination);
  };

  return (
    <DataTableBase
      {...rest}
      pagination={pagination}
      onPagination={onPagination}
      sort={sort}
      onSort={onSort}
      data={dataset}
    />
  );
});

export default DataTable;
