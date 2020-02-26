/**
 * @flow
 */

import invariant from "invariant";
import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource2";
import * as mui from "@material-ui/core";

import { introspect } from "./Introspection";
import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import * as QueryPath from "./QueryPath.js";
import * as Field from "./Field.js";
import * as Filter from "./Filter.js";

export type SelectProps<V, R, O = *> = {|
  /** GraphQL endpoint. */
  endpoint: Endpoint,
  /** Resource to get data from GraphQL. */
  resource: Resource.Resource<V, R>,
  getRows: R => O,

  /** Field which specifies the label. */
  labelField: Field.FieldConfig<>,
  /** Field which specifies the id. */
  idField?: Field.FieldConfig<>,
  /** Additional fields to query. */
  fields?: Array<Field.FieldConfig<>>,

  /** Currently selected value. */
  value: ?string,
  /** Called when user selects a new value. */
  onValue: (?string) => void,
|};

export function Select<V, R>(props: SelectProps<V, R>) {
  let {
    resource,
    getRows,
    endpoint,
    labelField,
    idField = "id",
    fields = [],
    value,
    onValue,
  } = props;

  let fieldSpecs = Field.configureFields(fields);

  let idFieldSpec = Field.configureField(idField);
  let labelFieldSpec = Field.configureField(labelField);

  return (
    <SelectRenderer
      endpoint={endpoint}
      resource={resource}
      getRows={getRows}
      fieldSpecs={fieldSpecs}
      idFieldSpec={idFieldSpec}
      labelFieldSpec={labelFieldSpec}
      value={value}
      onValue={onValue}
    />
  );
}

type SelectRendererProps<V, R, O = *> = {|
  endpoint: Endpoint,
  resource: Resource.Resource<V, R>,
  getRows: R => O,
  fieldSpecs: Array<Field.FieldSpec>,
  idFieldSpec: Field.FieldSpec,
  labelFieldSpec: Field.FieldSpec,
  value: ?string,
  onValue: (?string) => void,
|};

function SelectRenderer<V, R>({
  endpoint,
  resource,
  getRows,
  fieldSpecs,
  idFieldSpec,
  labelFieldSpec,
  value,
  onValue,
}: SelectRendererProps<V, R>) {
  let [isFetching, resourceData] = Resource.useResource(
    endpoint,
    resource,
    ({}: any),
  );

  if (isFetching || resourceData == null) {
    return null;
  }

  let data = getRows(resourceData);
  let items = data.map(item => {
    let id = item[idFieldSpec.name];
    let label = item[labelFieldSpec.name];
    return (
      <mui.MenuItem key={id} value={id}>
        {label}
      </mui.MenuItem>
    );
  });
  let onChange = e => {
    let value = e.target.value;
    if (value === EMPTY_VALUE_SENTINEL) {
      value = null;
    }
    onValue(value);
  };
  if (value == null) {
    value = EMPTY_VALUE_SENTINEL;
  }
  return (
    <mui.Select value={value} onChange={onChange} style={{ width: "100%" }}>
      <mui.MenuItem key={EMPTY_VALUE_SENTINEL} value={EMPTY_VALUE_SENTINEL} />
      {items}
    </mui.Select>
  );
}

const EMPTY_VALUE_SENTINEL = "__empty__";
