/**
 * This describes field configuration.
 *
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { capitalize } from "./helpers.js";
import { RenderValue } from "./RenderValue";

/**
 * This configures how we render fields in pick/show screens.
 */
export type FieldConfig<R, +K = $Keys<R>> =
  /** Render field in default configuration. */
  | K
  /** Specify field rendering configuration. */
  | {|
      +name: string,
      +field?: K | (R => mixed),
      +hideTitle?: boolean,
      +title?: string,
      +sortable?: boolean,
      +editable?: (data: R) => boolean,
      +render?: React.AbstractComponent<{| +data: R, +value: mixed |}>,
      +edit?: (data: R, value: mixed) => void | Promise<void>,
      +renderEdit?: React.AbstractComponent<{|
        +data: R,
        +value: mixed,
        onChange: (value: mixed) => void,
        inputRef: any,
        onKeyDown: (ev: KeyboardEvent) => void,
      |}>,
      +width?: number,
    |};

export opaque type FieldSpec: {
  name: string,
  title: ?string,
  sortable: boolean,
  editable: (data: any) => boolean,
  width: ?number,
  edit?: (data: any, value: mixed) => void | Promise<void>,
} = {|
  name: string,
  title: ?string,
  field?: string | (any => mixed),
  sortable: boolean,
  editable: (data: any) => boolean,
  render: ?React.AbstractComponent<{| +data: any, +value: mixed |}>,
  +renderEdit: ?React.AbstractComponent<{|
    +data: any,
    +value: mixed,
    onChange: (value: mixed) => void,
    inputRef: any,
    onKeyDown: (ev: KeyboardEvent) => void,
  |}>,
  edit?: (data: any, value: mixed) => void | Promise<void>,
  width: ?number,
|};

export function configureField<R: { [name: string]: any }>(
  config: FieldConfig<R>,
): FieldSpec {
  switch (typeof config) {
    case "string": {
      return {
        name: config,
        title: guessFieldTitle(config),
        field: config,
        sortable: true,
        render: null,
        renderEdit: null,
        width: null,
        editable: data => false,
      };
    }

    default: {
      return {
        name: config.name,
        title: config.hideTitle
          ? null
          : config.title || guessFieldTitle(config.name),
        field: config.field,
        render: config.render,
        renderEdit: config.renderEdit,
        edit: config.edit,
        width: config.width,
        sortable: config.sortable || false,
        editable: config.editable ?? (data => !!config.edit),
      };
    }
  }
}

export function configureFields<R: { [name: string]: any }>(
  configs: Array<FieldConfig<R>>,
): Array<FieldSpec> {
  return configs.map(c => configureField(c));
}

export function guessFieldTitle(field: string) {
  switch (field) {
    case "id":
      return "ID";
    case "":
      return "Column";
    default:
      return field
        .split("_")
        .map(capitalize)
        .join(" ");
  }
}

let conjunctions = ["the", "or", "and", "of", "with"];

export function guessLabel(option: string) {
  return option
    .split("-")
    .map(word => {
      if (conjunctions.includes(word)) {
        return word;
      }
      return capitalize(word);
    })
    .join(" ");
}

export function extract(spec: FieldSpec, data: any): mixed {
  if (spec.field == null) {
    return data;
  } else if (typeof spec.field === "string") {
    return data[spec.field];
  } else {
    return spec.field(data);
  }
}

export function render(spec: FieldSpec, data: any, value: mixed): React.Node {
  if (spec.render != null) {
    return <spec.render data={data} value={value} />;
  } else {
    return (
      <mui.Typography
        color="inherit"
        component="span"
        style={{ textOverflow: "ellipsis", overflow: "hidden" }}
      >
        {RenderValue({ value })}
      </mui.Typography>
    );
  }
}

export function renderEdit(
  spec: FieldSpec,
  data: any,
  value: mixed,
  onChange: (value: mixed) => void,
  inputRef: any,
  onKeyDown: (ev: KeyboardEvent) => void,
): React.Node {
  if (spec.renderEdit != null) {
    return (
      <spec.renderEdit
        data={data}
        value={value}
        onChange={onChange}
        inputRef={inputRef}
        onKeyDown={onKeyDown}
      />
    );
  } else {
    let onTextChange = ev => {
      let { value } = ev.currentTarget;
      onChange(value);
    };
    return (
      <mui.TextField
        InputProps={{ inputRef }}
        onKeyDown={onKeyDown}
        label={spec.title}
        value={value}
        onChange={onTextChange}
        margin="none"
        style={{ minWidth: 250 }}
      />
    );
  }
}
