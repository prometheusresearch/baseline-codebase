/**
 * @flow
 */

import invariant from "invariant";
import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource";
import * as mui from "@material-ui/core";

import { introspect } from "./Introspection";
import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import * as QueryPath from "./QueryPath.js";
import * as Field from "./FieldLegacy.js";

export type SelectProps = {|
  /** GraphQL endpoint. */
  endpoint: Endpoint,
  /** Path inside GraphQL schema. */
  fetch: string,

  /** Field which specifies the label. */
  labelField: Field.FieldConfig,
  /** Field which specifies the id. */
  idField?: Field.FieldConfig,
  /** Additional fields to query. */
  fields?: { [name: string]: Field.FieldConfig },

  /** Currently selected value. */
  value: ?string,
  /** Called when user selects a new value. */
  onValue: (?string) => void,
|};

export function Select(props: SelectProps) {
  let {
    fetch,
    endpoint,
    labelField,
    idField = "id",
    fields = {},
    value,
    onValue,
  } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let { resource, path, fieldSpecs } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let { query, fieldSpecs } = introspect({
      schema,
      path,
      fields: { ...fields, id: idField, label: labelField },
    });
    let resource = Resource.defineQuery<void, any>({ endpoint, query });
    return { path, resource, fieldSpecs };
  }, [fetch, endpoint, schema, labelField]);

  return (
    <SelectRenderer
      path={path}
      resource={resource}
      fieldSpecs={fieldSpecs}
      value={value}
      onValue={onValue}
    />
  );
}

type SelectRendererProps = {|
  path: QueryPath.QueryPath,
  resource: Resource.Resource<any, any>,
  fieldSpecs: { id: Field.FieldSpec, label: Field.FieldSpec },
  value: ?string,
  onValue: (?string) => void,
|};

function SelectRenderer({
  path,
  resource,
  fieldSpecs,
  value,
  onValue,
}: SelectRendererProps) {
  let data = Resource.unstable_useResource(resource);
  for (let key of QueryPath.toArray(path)) {
    if (data == null) {
      break;
    }
    data = data[key];
  }
  let items = data.map(item => {
    let id = item[fieldSpecs.id.require.field];
    let label = item[fieldSpecs.label.require.field];
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
