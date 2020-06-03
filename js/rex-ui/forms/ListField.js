/**
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { type Field, useField } from "./State.js";

type RenderItemProps<I> = {|
  item: I,
  onChange: (item: I) => Promise<void>,
  onRemove: () => void,
  disabled: ?boolean,
|};

export function ListField<V: { [name: string]: any }, I: { id?: any }>({
  form,
  label,
  name,
  disabled,
  placeholder,
  RenderItem,
  addItemProps,
  onItemChange,
}: {|
  form: Field<V>,
  name: $Keys<V>,
  label: string,
  disabled?: boolean,
  placeholder?: string,
  RenderItem: React.AbstractComponent<RenderItemProps<I>>,
  onItemChange?: (item: I) => Promise<I>,
  addItemProps?: {| text: string, generateItem: () => I |},
|}) {
  let field = useField(form, name);
  let value = field.useValue();
  let styles = useStyles();
  return React.useMemo(() => {
    let onChange = index => async itemValue => {
      field.setIsDirty(true);
      let newItem = itemValue;
      let data = (value.value || []).map((item, idx) =>
        index === idx ? newItem : item,
      );
      field.update(_ => data);
      if (onItemChange) {
        newItem = await onItemChange(itemValue);
        data = (value.value || []).map((item, idx) =>
          index === idx ? newItem : item,
        );
      }
      field.update(_ => data);
    };
    let onRemove = index => () => {
      field.setIsDirty(true);
      let data = (value.value || []).filter((item, idx) => idx !== index);
      field.update(_ => data);
    };
    let _onBlur = ev => {
      field.setIsDirty(true);
    };
    let onAddItemClick;
    if (addItemProps) {
      onAddItemClick = () => {
        field.setIsDirty(true);
        let data = (value.value || []).concat(addItemProps.generateItem());
        field.update(_ => data);
      };
    }
    let error = value.errorMessage;
    if (!value.isDirty) {
      error = null;
    }
    let values = value.value ?? [];
    return (
      <>
        {values.length > 0 ? (
          values.map((value, idx) => (
            <RenderItem
              key={idx}
              item={value}
              disabled={disabled}
              onChange={onChange(idx)}
              onRemove={onRemove(idx)}
            />
          ))
        ) : (
          <mui.Typography variant="body2">
            {placeholder ?? "No items"}
          </mui.Typography>
        )}
        {addItemProps && (
          <div className={styles.addItemButtonContainer}>
            <mui.Button onClick={onAddItemClick}>
              {addItemProps.text}
            </mui.Button>
          </div>
        )}
        {error && (
          <mui.FormHelperText error={true} title={error}>
            {error}
          </mui.FormHelperText>
        )}
      </>
    );
  }, [
    value,
    field,
    disabled,
    placeholder,
    addItemProps,
    onItemChange,
    styles.addItemButtonContainer,
  ]);
}

let useStyles = makeStyles(theme => ({
  addItemButtonContainer: {
    marginTop: theme.spacing.unit,
  },
}));
