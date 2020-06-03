/**
 * @flow
 */

import * as React from "react";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource2";

import { ShowRenderer, type ShowRendererProps } from "./ShowRenderer.js";
import * as Field from "./Field.js";
import * as Action from "./Action.js";
import { LoadingCard } from "./LoadingCard";
import { NotFoundCard } from "./NotFoundCard";

export type ShowProps<V, R, O = *> = {|
  flat?: boolean,
  square?: boolean,
  endpoint: Endpoint,
  resource: Resource.Resource<V, R>,
  getRows: R => ?O,
  fields?: Field.FieldConfig<O, $Keys<O>>[],
  titleField?: ?Field.FieldConfig<O, $Keys<O>>,
  subtitleField?: ?Field.FieldConfig<O, $Keys<O>>,
  params: V,
  actions?: Action.ActionConfig<void, O>[],
  render?: ?(ShowRendererProps<O>) => React.Node,
|};

export let Show = <V, R>(props: ShowProps<V, R>) => {
  let {
    endpoint,
    resource,
    fields: fields_ = [],
    titleField: titleField_,
    subtitleField: subtitleField_,
    getRows,
    params,
    render,
    flat,
    square,
    ...rest
  } = props;

  let fields = Field.configureFields(fields_);
  let titleField =
    titleField_ != null ? Field.configureField(titleField_) : null;
  let subtitleField =
    subtitleField_ != null ? Field.configureField(subtitleField_) : null;

  let [isFetching, resourceData] = Resource.useResource(
    endpoint,
    resource,
    params,
  );

  if (isFetching && resourceData == null) {
    return <LoadingCard flat={flat} square={square} />;
  }

  if (resourceData == null) {
    return <NotFoundCard flat={flat} square={square} />;
  }

  let data = getRows(resourceData);
  if (data == null) {
    return <NotFoundCard flat={flat} square={square} />;
  }

  let renderProps = {
    data,
    fields,
    titleField,
    subtitleField,
    flat,
    square,
    ...rest,
  };
  if (render != null) {
    return render(renderProps);
  } else {
    return <ShowRenderer {...renderProps} />;
  }
};
