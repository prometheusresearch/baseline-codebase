/**
 * @flow
 */

import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource2";

import { PickRenderer, type PickRendererConfigProps } from "./PickRenderer.js";
import * as Field from "./Field.js";
import * as Filter from "./Filter.js";
import { ErrorBoundary } from "./ErrorBoundary.js";

export type PickProps<V: { [key: string]: any }, R, O = *> = {|
  endpoint: Endpoint,
  resource: Resource.Resource<V, R>,
  getRows: R => Array<O>,
  variablesSet: Set<string>,
  fields: Array<Field.FieldConfig<$Keys<O>>>,
  filters?: ?Array<Filter.FilterConfig<$Keys<V>>>,
  //TODO(vladimir.khapalov): do we need to use it like
  // filters?: ?Array<Filter.FilterConfig<$Keys<V>>>
  // if yes then we have to mention that V is an object
  sortingConfig?: ?Array<{| desc: boolean, field: string |}>,
  ...PickRendererConfigProps,
|};

export let PickBase = <V: { [key: string]: any }, R>(
  props: PickProps<V, R>,
) => {
  let {
    endpoint,
    fields,
    filters,
    resource,
    getRows,
    variablesSet,
    sortingConfig,
    ...rest
  } = props;

  let [selected, setSelected] = React.useState(new Set());

  let fieldSpecs = Field.configureFields(fields);
  let filterSpecs = Filter.configureFilters(filters);

  return (
    <PickRenderer
      {...rest}
      endpoint={endpoint}
      selected={selected}
      onSelected={setSelected}
      fieldSpecs={fieldSpecs}
      filterSpecs={filterSpecs}
      resource={resource}
      getRows={getRows}
      variablesSet={variablesSet}
      sortingConfig={sortingConfig}
    />
  );
};

export let Pick = <V: { [key: string]: any }, R>(props: PickProps<V, R>) => (
  <ErrorBoundary>
    <PickBase {...props} />
  </ErrorBoundary>
);
