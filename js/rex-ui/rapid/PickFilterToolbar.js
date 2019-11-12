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
import { type PickState } from "./PickRenderer";
import { useStyles } from "./PickStyles.js";
import * as Field from "./Field.js";

export const PickFilterToolbar = ({
  variableDefinitions,
  state,
  sortingConfig,
  setFilterState,
  setSortingState,
  setSearchState,
  isTabletWidth
}: {|
  state: PickState,
  variableDefinitions: VariableDefinitionNode[] | void,
  sortingConfig: Array<{| desc: boolean, field: string |}>,
  setSearchState: (val: string) => void,
  setFilterState: (name: string, value: ?boolean) => void,
  setSortingState: (value: string) => void,
  isTabletWidth?: boolean
|}) => {
  if (variableDefinitions == null) {
    return null;
  }

  const classes = useStyles();
  const hasSorting = sortingConfig.length > 0;
  const hasSearch = state.search != null;

  const classNames = [classes.tableControl];
  if (!isTabletWidth) {
    classNames.push(classes.tableFiltersWrapperMobile);
  }

  return (
    <Grid
      container
      direction="row"
      justify="flex-end"
      alignItems="center"
      className={classNames.join(" ")}
    >
      <Grid item>
        <FormGroup row>
          {hasSearch ? (
            <FormControl className={classes.formControl}>
              <TextField
                label="Search"
                value={state.searchText}
                onChange={ev => {
                  setSearchState(ev.target.value);
                }}
                margin={"none"}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </FormControl>
          ) : null}

          {hasSorting ? (
            <FormControl className={classes.formControl}>
              <InputLabel htmlFor={`sorting`}>{"Sorting"}</InputLabel>
              <Select
                value={
                  state.sort
                    ? JSON.stringify(state.sort)
                    : Field.FILTER_NO_VALUE
                }
                onChange={ev => {
                  setSortingState(ev.target.value);
                }}
                inputProps={{
                  name: `sorting`
                }}
              >
                <MenuItem
                  key={Field.FILTER_NO_VALUE}
                  value={Field.FILTER_NO_VALUE}
                />
                {sortingConfig.map((obj, index) => {
                  const value = JSON.stringify(obj);
                  return (
                    <MenuItem key={index} value={value}>
                      {`${obj.field}, ${obj.desc ? "desc" : "asc"}`}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          ) : null}

          {variableDefinitions
            .filter(varDef => {
              // Get only Boolean vars
              // $FlowFixMe
              const value = varDef.type.name
                ? varDef.type.name.value
                : undefined;
              return value === "Boolean";
            })
            .map(varDef => {
              const booleanFilterName = varDef.variable.name.value;

              return (
                <BooleanFilter
                  key={booleanFilterName}
                  value={state.filter[booleanFilterName]}
                  onValue={value => setFilterState(booleanFilterName, value)}
                  name={booleanFilterName}
                />
              );
            })}
        </FormGroup>
      </Grid>
    </Grid>
  );
};

function BooleanFilter({
  name,
  label,
  value,
  onValue
}: {|
  value: ?boolean,
  onValue: (?boolean) => void,
  label?: string,
  name: string
|}) {
  const classes = useStyles();

  return (
    <FormControl key={`boolean-filter-${name}`} className={classes.formControl}>
      <InputLabel htmlFor={`boolean-filter-${name}`}>
        {label || Field.guessFieldTitle(name)}
      </InputLabel>
      <Select
        value={value == null ? Field.FILTER_NO_VALUE : value}
        onChange={ev => {
          onValue(
            ev.target.value === Field.FILTER_NO_VALUE ? null : ev.target.value
          );
        }}
        inputProps={{
          name: `boolean-filter-${name}`
        }}
      >
        <MenuItem value={Field.FILTER_NO_VALUE} />
        <MenuItem value={false}>No</MenuItem>
        <MenuItem value={true}>Yes</MenuItem>
      </Select>
    </FormControl>
  );
}
