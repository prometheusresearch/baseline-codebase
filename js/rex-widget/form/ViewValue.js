/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactForms from "react-forms";
import { VBox, HBox, Element } from "react-stylesheet";
import * as rexui from "rex-ui";
import * as mui from "@material-ui/core";
import * as Layout from "./Layout";

export type RenderValue = mixed => React.Node;

type Props = {|
  label?: ?string,
  hint?: ?string,
  formValue?: ReactForms.value,
  select?: ReactForms.select,
  layout?: Layout.layout,
  renderValue?: RenderValue,
|};

export function ViewValue(props: Props) {
  let {
    layout,
    label,
    hint,
    formValue: formValueOfProps,
    select,
    renderValue = renderValueDefault,
  } = props;
  let formValue = ReactForms.useFormValue(formValueOfProps, select);
  let layoutOfContext = Layout.useFormLayout();
  if (layout == null) {
    layout = layoutOfContext;
  }

  let theme = rexui.useTheme();
  let children = renderValue(formValue.value);

  let labelSizePercent = `30%`;
  let inputSizePercent = `70%`;

  if (
    label == null &&
    formValue.schema != null &&
    formValue.schema.label != null
  ) {
    label = formValue.schema.label;
  }

  let hintElement = null;
  if (hint != null) {
    hintElement = (
      <mui.FormHelperText variant="standard">{hint}</mui.FormHelperText>
    );
  }

  let spacing = 8;
  if (layout === "horizontal") {
    let padding = {
      vertical: spacing,
      horizontal: 0,
    };
    return (
      <VBox>
        <HBox alignItems="center">
          {label != null ? (
            <Element padding={padding} width={labelSizePercent}>
              <mui.Typography
                style={{
                  fontSize: "1rem",
                  color: theme.palette.text.secondary,
                }}
              >
                {label}
              </mui.Typography>
            </Element>
          ) : null}
          <Element padding={padding} width={inputSizePercent} minHeight="1em">
            {children}
            {hintElement}
          </Element>
        </HBox>
      </VBox>
    );
  } else {
    let padding = {
      vertical: spacing / 2,
      horizontal: 0,
    };
    return (
      <VBox padding={padding}>
        <mui.Typography
          style={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}
        >
          {label}
        </mui.Typography>
        <Element padding="6px 0px 7px" minHeight="1rem">
          {children == null ? "\u00A0" : children}
          {hintElement}
        </Element>
      </VBox>
    );
  }
}

function renderValueDefault(value): React.Node {
  let children = null;
  if (value == null) {
    return null;
  } else if (value.type && value.props) {
    return (value: any);
  } else if (typeof value === "string") {
    return renderAsLines(value);
  } else {
    return String(value);
  }
}

function renderAsLines(value) {
  let lines = value
    .trim()
    .split("\n")
    .map((line, idx) => (
      <p key={idx} style={{ margin: 0 }}>
        {line}
      </p>
    ));

  return <>{lines}</>;
}
