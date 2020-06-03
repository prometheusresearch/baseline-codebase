/**
 * @flow
 */

import * as React from "react";

import { FormGroup, Grid } from "@material-ui/core";

import type { Params } from "./Pick.js";
import Search from "rex-ui/Search";
import * as Filter from "../Filter.js";
import { useDebouncedCallback } from "../../useDebouncedCallback.js";

type Props = {|
  params: Params,
  onParams: ((Params) => Params) => void,
  search: ?Filter.FilterSpec,
|};

export function PickSearchToolbar({ params, onParams, search }: Props) {
  let element = null;
  if (search != null) {
    element = (
      <search.render name={search.name} params={params} onParams={onParams} />
    );
  }

  return (
    <Grid container direction="row" justify="flex-end" alignItems="center">
      <Grid item xs={12}>
        <FormGroup row>
          {element != null && (
            <Grid item xs={12}>
              {element}
            </Grid>
          )}
        </FormGroup>
      </Grid>
    </Grid>
  );
}

export function RenderSearch({
  name,
  params,
  onParams,
}: Filter.RenderFilterProps<any>) {
  let [text, setText] = React.useState(params[name] ?? "");
  let handleChange = search => {
    setText(search);
    onChange(search);
  };
  let onChange = useDebouncedCallback(
    500,
    search =>
      onParams(value => {
        return { ...value, [name]: search === "" ? undefined : search };
      }),
    [onParams],
  );
  return <Search text={text} onChangeText={handleChange} />;
}
