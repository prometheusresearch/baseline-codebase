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

export type ListProps = {|
  endpoint: Endpoint,
  fetch: string,
  primaryTextField: Field.FieldConfig,
  id: string[],
  selected?: Set<string>,
  onSelected?: (Set<string>) => void,
|};

export function List(props: ListProps) {
  let { fetch, endpoint, primaryTextField, id, selected, onSelected } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let { resource, path } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let fields = ["id", primaryTextField];
    let { query, ast, fieldSpecs } = introspect({
      schema,
      path,
      fields,
    });
    let resource = Resource.defineQuery<void, any>({ endpoint, query });
    return { path, resource, fieldSpecs };
  }, [fetch, endpoint, schema, primaryTextField]);

  return (
    <ListRenderer
      path={path}
      resource={resource}
      primaryTextField={primaryTextField}
      id={id}
      selected={selected}
      onSelected={onSelected}
    />
  );
}

type ListRendererProps = {|
  path: QueryPath.QueryPath,
  resource: Resource.Resource<any, any>,
  primaryTextField: Field.FieldConfig,
  id: string[],
  selected?: Set<string>,
  onSelected?: (Set<string>) => void,
|};

function ListRenderer({
  path,
  resource,
  primaryTextField,
  id,
  selected,
  onSelected,
}: ListRendererProps) {
  let data = Resource.unstable_useResource(resource, { id: id });

  for (let key of QueryPath.toArray(path)) {
    if (data == null) {
      break;
    }
    data = data[key];
  }

  let RenderPrimaryText = React.useCallback(
    props => {
      return props.item[primaryTextField];
    },
    [primaryTextField],
  );

  return (
    <ListOfData
      data={data}
      selected={selected}
      onSelected={onSelected}
      RenderPrimaryText={RenderPrimaryText}
    />
  );
}

type ListOfDataProps = {|
  data: Object[],
  selected?: ?Set<string>,
  onSelected?: ?(Set<string>) => void,
  onClick?: Object => void,
  RenderPrimaryText: React.AbstractComponent<{| item: Object |}>,
  RenderSecondaryText?: React.AbstractComponent<{| item: Object |}>,
|};

export function ListOfData(props: ListOfDataProps) {
  let {
    data,
    selected,
    onSelected,
    onClick,
    RenderPrimaryText,
    RenderSecondaryText,
  } = props;
  let items = data.map(item => {
    let primary = <RenderPrimaryText item={item} />;
    let secondary =
      RenderSecondaryText != null ? <RenderSecondaryText item={item} /> : null;
    let handleChange = e => {
      if (selected != null) {
        let nextSelected = new Set(selected);
        if (e.target.checked) {
          nextSelected.add(item.id);
        } else {
          nextSelected.delete(item.id);
        }
        if (onSelected != null) {
          onSelected(nextSelected);
        }
      }
    };
    let handleClick =() => {
      if (onClick!= null) {
        console.log(item);
        onClick(item);
      }
    };
    return (
      <mui.ListItem
        key={item.id}
        button={onClick != null}
        onClick={handleClick}
      >
        {selected != null && (
          <mui.Checkbox
            style={{ padding: 0 }}
            checked={selected.has(item.id)}
            handleChange={handleChange}
            tabIndex={-1}
            disableRipple
          />
        )}
        <mui.ListItemText primary={primary} secondary={secondary} />
      </mui.ListItem>
    );
  });
  return <mui.List>{items}</mui.List>;
}
