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

export type ListProps<V, R, O = *> = {|
  endpoint: Endpoint,
  resource: Resource.Resource<V, R>,
  getRows: R => Array<O>,
  primaryTextField: Field.FieldConfig<$Keys<O>>,
  params: V,
  selected?: Set<string>,
  onSelected?: (Set<string>) => void,
|};

export function List<V, R>(props: ListProps<V, R>) {
  let {
    endpoint,
    resource,
    getRows,
    primaryTextField,
    params,
    selected,
    onSelected,
  } = props;

  let primaryTextFieldSpec = Field.configureField(primaryTextField);

  return (
    <ListRenderer
      endpoint={endpoint}
      resource={resource}
      getRows={getRows}
      primaryTextFieldSpec={primaryTextFieldSpec}
      params={params}
      selected={selected}
      onSelected={onSelected}
    />
  );
}

type ListRendererProps<V, R, O = *> = {|
  endpoint: Endpoint,
  resource: Resource.Resource<V, R>,
  getRows: R => O,
  primaryTextFieldSpec: Field.FieldSpec,
  params: V,
  selected?: Set<string>,
  onSelected?: (Set<string>) => void,
|};

function ListRenderer<V, R>({
  endpoint,
  resource,
  getRows,
  primaryTextFieldSpec,
  params,
  selected,
  onSelected,
}: ListRendererProps<V, R>) {
  let [isFetching, resourceData] = Resource.useResource(
    endpoint,
    resource,
    params,
  );

  let RenderPrimaryText = React.useCallback(
    props => props.item[primaryTextFieldSpec.name],
    [primaryTextFieldSpec],
  );

  if (resourceData == null) {
    return null;
  }

  let data = getRows(resourceData);

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
  let items = data.map((item, index) => {
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
    let handleClick = () => {
      if (onClick != null) {
        onClick(item);
      }
    };
    return (
      <mui.ListItem
        key={`${item.id}-${index}`}
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
