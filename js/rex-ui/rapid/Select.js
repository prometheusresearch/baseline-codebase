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
import * as Field from "./Field.js";

export type SelectProps = {|
  endpoint: Endpoint,
  fetch: string,
  labelField: Field.FieldConfig,
  value: ?string,
  onValue: (?string) => void,
|};

export function Select(props: SelectProps) {
  let { fetch, endpoint, labelField, value, onValue } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let { resource, path, fieldSpecs } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let fields = { id: "id", label: labelField };
    let { query, fieldSpecs } = introspect({
      schema,
      path,
      fields,
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
    let label = item[fieldSpecs.label.require.field];
    return (
      <mui.MenuItem key={item.id} value={item.id}>
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
