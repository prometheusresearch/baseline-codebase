/**
 * @flow
 */
import * as React from "react";

import Grid from "@material-ui/core/Grid";
import Table from "@material-ui/core/Table";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import FormGroup from "@material-ui/core/FormGroup";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";

import { type VariableDefinitionNode } from "graphql/language/ast";
import { type PickState, SEARCH_VAR_NAME } from "./PickRenderer";

import * as Field from "./Field.js";

import { makeStyles, type Theme, useTheme } from "@material-ui/styles";
import { DEFAULT_THEME } from "./themes";
import { isEmptyObject, capitalize } from "./helpers";

export const useFilterStyles = makeStyles((theme: Theme) => {
  if (theme.palette == null || isEmptyObject(theme)) {
    theme = DEFAULT_THEME;
  }

  return {
    tableControl: {},
    formControl: {
      minWidth: 320,
      width: "100%",
      padding: 0,
    },
  };
});

type Props = {|
  state: PickState,
  variablesMap: ?Map<string, VariableDefinitionNode>,
  setSearchState: (val: string) => void,
  filterSpecs: ?Field.FilterSpecMap,
|};

const PickSearchToolbarBase = ({
  variablesMap,
  state,
  setSearchState,
  filterSpecs,
}: Props) => {
  if (variablesMap == null) {
    return null;
  }

  const classes = useFilterStyles();

  const classNames = [classes.tableControl];

  let CustomSearchRenderer: ?React.ComponentType<{
    onChange: (newValue: any) => void,
    value: any,
    values?: Array<any>,
  }> = null;
  if (filterSpecs != null) {
    if (filterSpecs.get(SEARCH_VAR_NAME) != null) {
      // $FlowFixMe
      if (filtersSpecs.get(SEARCH_VAR_NAME).render != null) {
        // $FlowFixMe
        CustomSearchRenderer = (filtersSpecs.get(SEARCH_VAR_NAME).render: any);
      }
    }
  }

  const SearchRenderer =
    state.search == null ? null : CustomSearchRenderer ? (
      <CustomSearchRenderer
        onChange={(newValue: string) => {
          setSearchState(newValue);
        }}
        value={state.searchText}
      />
    ) : (
      <FormControl className={classes.formControl}>
        <TextField
          label={"Search"}
          value={state.searchText}
          onChange={ev => {
            setSearchState(ev.target.value);
          }}
          margin={"none"}
          InputLabelProps={{
            shrink: true,
          }}
        />
      </FormControl>
    );

  return (
    <Grid
      container
      direction="row"
      justify="flex-end"
      alignItems="center"
      className={classNames.join(" ")}
    >
      <Grid item xs={12}>
        <FormGroup row>
          {state.search != null ? (
            <Grid item xs={12}>
              {SearchRenderer}
            </Grid>
          ) : null}
        </FormGroup>
      </Grid>
    </Grid>
  );
};

export const PickSearchToolbar = (props: Props) => {
  return <PickSearchToolbarBase {...props} />;
};
