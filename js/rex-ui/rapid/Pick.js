/**
 * @flow
 */

import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource2";

import { PickRenderer, type PickRendererConfigProps } from "./PickRenderer.js";
import * as FieldLegacy from "./FieldLegacy.js";
import * as Field from "./Field.js";
import { ErrorBoundary } from "./ErrorBoundary.js";

export type PickProps<V, R, O = *> = {|
  endpoint: Endpoint,
  resource: Resource.Resource<V, R>,
  getRows: R => Array<O>,
  fields: Array<Field.FieldConfig<>>,
  filters?: ?Array<FieldLegacy.FilterConfig>,
  sortingConfig?: ?Array<{| desc: boolean, field: string |}>,
  ...PickRendererConfigProps,
|};

export let PickBase = <V, R>(props: PickProps<V, R>) => {
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
  let filterSpecs = FieldLegacy.configureFilters(filters);

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

export let Pick = <V, R>(props: PickProps<V, R>) => (
  <ErrorBoundary>
    <PickBase {...props} />
  </ErrorBoundary>
);
