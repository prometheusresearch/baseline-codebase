/**
 * @flow
 */

import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource2";
import * as mui from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import * as Field from "./Field.js";
import * as Action from "./Action.js";
import { type Status, StatusIcon } from "./Status.js";

export type Props<V, R, O: { id: mixed } = *> = {|
  endpoint: Endpoint,
  resource: Resource.Resource<V, R>,
  params: V,
  getRows: R => Array<O>,
  primaryField: Field.FieldConfig<O, $Keys<O>>,
  secondaryField?: Field.FieldConfig<O, $Keys<O>>,
  selected?: Set<mixed>,
  onSelected?: (selected: Set<mixed>, items: O[]) => void,
  onClick?: O => void,
|};

export function List<V, R, O: { id: mixed }>(props: Props<V, R, O>) {
  let {
    endpoint,
    resource,
    getRows,
    primaryField,
    secondaryField,
    params,
    selected,
    onSelected,
    onClick,
  } = props;

  let [_isFetching, resourceData] = Resource.useResource(
    endpoint,
    resource,
    params,
  );

  let RenderItem = React.useCallback(
    props => {
      let primaryFieldSpec = Field.configureField(primaryField);
      let primary = Field.render(
        primaryFieldSpec,
        props.item,
        Field.extract(primaryFieldSpec, props.item),
      );
      let secondary = null;
      if (secondaryField != null) {
        let secondaryFieldSpec = Field.configureField(secondaryField);
        secondary = Field.render(
          secondaryFieldSpec,
          props.item,
          Field.extract(secondaryFieldSpec, props.item),
        );
      }
      return <mui.ListItemText primary={primary} secondary={secondary} />;
    },
    [primaryField, secondaryField],
  );

  if (resourceData == null) {
    return null;
  }

  let items = getRows(resourceData);

  return (
    <ListRenderer
      items={items}
      selected={selected}
      onSelected={onSelected}
      onClick={onClick}
      RenderItem={RenderItem}
    />
  );
}

type ListRendererProps<R> = {|
  items: R[],
  placeholder?: string,
  selected?: Set<mixed>,
  onSelected?: (Set<mixed>, R[]) => void,
  onClick?: R => void,
  RenderItem: React.AbstractComponent<{|
    item: R,
    onChange: ?(item: R) => Promise<void>,
    onRemove: ?() => void,
  |}>,
  actions?: Action.ActionConfig<void, R[]>[],
  editItem?: (idx: number, item: R) => Promise<void>,
  removeItem?: (idx: number) => void,
|};

export function ListRenderer<R: { id: mixed }>(props: ListRendererProps<R>) {
  let {
    items,
    selected = new Set(),
    onSelected,
    onClick,
    RenderItem,
    editItem,
    removeItem,
    placeholder,
    actions,
  } = props;
  let styles = useStyles();
  let onChangeItem;
  let onRemoveItem;
  onChangeItem = (idx: number) => async (item: R) => {
    editItem && editItem(idx, item);
  };
  onRemoveItem = (idx: number) => () => {
    removeItem && removeItem(idx);
  };
  let actionbar =
    actions != null ? (
      <div className={styles.actionbar}>
        {actions.map(action => (
          <div key={action.name}>{Action.render(action, items, undefined)}</div>
        ))}
      </div>
    ) : null;
  let elements =
    items.length > 0 ? (
      items.map((item, index) => {
        let handleChange = e => {
          if (selected != null) {
            let nextSelected = new Set(selected);
            if (e.target.checked) {
              nextSelected.add(item.id);
            } else {
              nextSelected.delete(item.id);
            }
            if (onSelected != null) {
              onSelected(nextSelected, items);
            }
          }
        };
        let handleClick = () => {
          if (onClick != null) {
            onClick(item);
          }
        };
        let key = `${String(item.id)}-${index}`;
        return (
          <mui.ListItem
            key={key}
            button={onClick != null}
            onClick={handleClick}
          >
            {onSelected != null && (
              <mui.Checkbox
                style={{ padding: 0 }}
                checked={selected.has(item.id)}
                handleChange={handleChange}
                tabIndex={-1}
                disableRipple
              />
            )}
            <RenderItem
              item={item}
              onChange={onChangeItem ? onChangeItem(index) : null}
              onRemove={onRemoveItem ? onRemoveItem(index) : null}
            />
          </mui.ListItem>
        );
      })
    ) : (
      <mui.ListItem disabled>
        <mui.ListItemText primary={placeholder} />
      </mui.ListItem>
    );
  return (
    <mui.List>
      {actionbar}
      {elements}
    </mui.List>
  );
}

type ListItemProps = {|
  primary: React.Node,
  secondary?: ?React.Node,
  icon?: ?React.Node,
  status?: ?Status,
|};

export function ListItem({ primary, secondary, icon, status }: ListItemProps) {
  let iconElement = null;
  if (icon != null) {
    iconElement = icon;
  } else if (status != null) {
    iconElement = <StatusIcon status={status} />;
  }
  return (
    <>
      {iconElement != null && (
        <mui.ListItemIcon>{iconElement}</mui.ListItemIcon>
      )}
      <mui.ListItemText primary={primary} secondary={secondary} />
    </>
  );
}

let useStyles = makeStyles(theme => ({
  actionbar: {
    display: "inline-flex",
    paddingBottom: theme.spacing.unit,
  },
}));
