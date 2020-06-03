/**
 * @flow
 */

import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource2";

import {
  PickRenderer,
  type PickRendererConfigProps,
  type PickSelection,
} from "./PickRenderer.js";
import * as Action from "../Action.js";
import * as Sort from "../Sort.js";
import * as Field from "../Field.js";
import * as Filter from "../Filter.js";
import { useMinWindowWidth } from "./useMinWindowWidth.js";
import { RenderSearch } from "./PickSearchToolbar.js";
import { type Params } from "../useParams.js";
import useParams from "../useParams.js";

const LIMIT_MOBILE = 21;
const LIMIT_DESKTOP = 51;

export type SortOption = {|
  field: string,
  title?: ?string,
  desc?: ?boolean,
|};

export type SortRendererProps = {|
  sort: ?Sort.SortDirection,
  onSort: (sortDirection: ?Sort.SortDirection) => void,
  options: SortOption[],
|};

export type SortSpec<K> = {|
  field: K,
  options: SortOption[],
  render?: React.AbstractComponent<SortRendererProps>,
|};

export type { Params };

export type Props<V: { [key: string]: any }, R, O = *> = {|
  endpoint: Endpoint,
  resource: Resource.Resource<V, R>,
  getRows: R => Array<O>,
  actions?: Action.ActionConfig<V, PickSelection<O>>[],
  fields: Array<Field.FieldConfig<O, $Keys<O>>>,
  search?: ?string,
  filters?: ?Array<Filter.FilterConfig<V>>,
  sorts?: ?SortSpec<$Keys<V>>,
  initialParams?: Params,
  id?: ?string,
  disablePagination?: boolean,
  ...PickRendererConfigProps<O>,
|};

export function Pick<V: { [key: string]: any }, R>(props: Props<V, R>) {
  let {
    endpoint,
    fields,
    filters,
    sorts,
    search,
    resource,
    getRows,
    actions,
    initialParams,
    id,
    disablePagination = false,
    ...rest
  } = props;
  let isTablet = useMinWindowWidth(720);

  let [params, setParams] = useParams({ namespace: id, initialParams });
  let [selected, setSelected] = React.useState(new Set());
  let [offset, setOffset] = React.useState(0);
  let [limit, setLimit] = React.useState(
    isTablet ? LIMIT_DESKTOP : LIMIT_MOBILE,
  );

  let onParams = params => {
    setParams(params);
    setSelected(new Set()); // reset selection when params change
  };

  React.useEffect(() => {
    setLimit(isTablet ? LIMIT_DESKTOP : LIMIT_MOBILE);
  }, [isTablet]);

  let resourceParams: any = buildParams({
    params,
    offset,
    limit,
    disablePagination,
  });
  let [isFetching, resourceData] = Resource.useResource(
    endpoint,
    resource,
    resourceParams,
  );

  const [data, hasNext] = React.useMemo(() => {
    if (isFetching || resourceData == null) {
      return [[], false];
    }
    let data = getRows(resourceData);
    /**
     * Used for pagination to have idea if received date length equal to limit
     * to know if incremention of page is allowed
     */
    let hasNext = data.length === limit;
    if (hasNext) {
      data = data.slice(0, data.length - 1);
    }
    return [data, hasNext];
  }, [getRows, isFetching, resourceData, limit]);

  let searchFilter = null;
  if (search != null) {
    searchFilter = {
      name: search,
      render: RenderSearch,
    };
  }

  return (
    <PickRenderer
      {...rest}
      params={params}
      onParams={onParams}
      isTabletWidth={isTablet}
      loading={isFetching}
      data={data}
      offset={offset}
      onOffset={setOffset}
      limit={limit}
      selected={selected}
      onSelected={setSelected}
      fields={Field.configureFields(fields)}
      filters={Filter.configureFilters(filters)}
      sorts={sorts}
      search={searchFilter}
      actions={actions}
      disablePagination={disablePagination}
      hasPrev={offset > 0}
      hasNext={hasNext}
    />
  );
}

export let buildParams = ({
  params,
  offset,
  limit,
  disablePagination,
}: {|
  params: Params,
  offset: number,
  limit: number,
  disablePagination: boolean,
|}) => {
  let all = { ...params };
  if (!disablePagination) {
    all.limit = limit;
    all.offset = offset;
  }
  let sort = params[Sort.PARAM_NAME];
  if (sort != null) {
    all[Sort.PARAM_NAME] = Sort.getSort(all);
  }
  return all;
};
