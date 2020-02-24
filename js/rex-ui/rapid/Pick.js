/**
 * @flow
 */

import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource2";

import { PickRenderer, type PickRendererConfigProps } from "./PickRenderer.js";
import * as Field from "./Field.js";
import { ErrorBoundary } from "./ErrorBoundary.js";

export type PickProps = {|
  endpoint: Endpoint,
  fields?: ?{ [name: string]: Field.FieldConfig },
  args?: { [key: string]: any },
  filters?: ?Array<Field.FilterConfig>,
  ...PickRendererConfigProps,
|};

export type PickProps2<V, R, O = *> = {|
  endpoint: Endpoint,
  resource: Resource.Resource<V, R>,
  getRows: R => Array<O>,
  fields?: ?{ [name: $Keys<O>]: Field.FieldConfig },
  filters?: ?Array<Field.FilterConfig>,
  sortingConfig?: ?Array<{| desc: boolean, field: string |}>,
  ...PickRendererConfigProps,
|};

export let PickBase = <V, R>(props: PickProps2<V, R>) => {
  let {
    endpoint,
    fields,
    filters,
    resource,
    getRows,
    sortingConfig,
    ...rest
  } = props;

  let [selected, setSelected] = React.useState(new Set());

  let fieldSpecs = Field.configureFields(fields);
  let filterSpecs = Field.configureFilters(filters);

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
      sortingConfig={sortingConfig}
    />
  );
};

export let Pick = <V, R, O: { [name: string]: mixed }>(
  props: PickProps2<V, R, O>,
) => (
  <ErrorBoundary>
    <PickBase {...props} />
  </ErrorBoundary>
);
