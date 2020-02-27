/**
 * @flow
 */

import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource2";

import { ShowRenderer, type ShowRendererConfigProps } from "./ShowRenderer.js";
import * as Field from "./Field.js";
import { ErrorBoundary } from "./ErrorBoundary";

export type ShowProps<V, R, O = *> = {|
  endpoint: Endpoint,
  resource: Resource.Resource<V, R>,
  getRows: R => ?O,
  fields: Field.FieldConfig<>[],
  titleField?: ?Field.FieldConfig<>,
  args?: { [key: string]: any },
  onAdd?: () => void,
  onRemove?: () => void,
  ...ShowRendererConfigProps,
|};

export let Show = <V, R>(props: ShowProps<V, R>) => {
  let {
    endpoint,
    resource,
    fields,
    titleField: titleFieldConfig,
    ...rest
  } = props;

  let fieldSpecs = Field.configureFields(fields);
  let titleField =
    titleFieldConfig != null ? Field.configureField(titleFieldConfig) : null;

  return (
    <ErrorBoundary>
      <ShowRenderer
        {...rest}
        endpoint={endpoint}
        resource={resource}
        titleField={titleField}
        fieldSpecs={fieldSpecs}
      />
    </ErrorBoundary>
  );
};
