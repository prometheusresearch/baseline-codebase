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
import { useStyles } from "./pick.renderer.styles";

export const PickFilterToolbar = ({
  variableDefinitions,
  filterState,
  sortingConfig,
  setFilterState,
  sortingState,
  setSortingState,
  searchState,
  setSearchState,
  isTabletWidth
}: {|
  variableDefinitions: VariableDefinitionNode[] | void,
  filterState: { [key: string]: boolean },
  sortingConfig: Array<{| desc: boolean, field: string |}>,
  sortingState: {| field: string, desc: boolean |} | void,
  searchState: ?string,
  setSearchState: (val: string) => void,
  setFilterState: (name: string, value: boolean) => void,
  setSortingState: (value: string) => void,
  isTabletWidth?: boolean
|}) => {
  if (variableDefinitions == null) {
    return null;
  }

  const classes = useStyles();
  const hasSorting = sortingConfig.length > 0;
  const hasSearch = searchState != null;

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
      className={classNames}
    >
      <Grid item>
        <FormGroup row>
          {hasSearch ? (
            <FormControl className={classes.formControl}>
              <TextField
                label="Search"
                value={searchState}
                onChange={ev => {
                  setSearchState(ev.target.value);
                }}
                onBlur={() => {
                  // Can not setIsSearchInFocus(false) here, since it would be also
                  // triggered by Suspense-based unmounts
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
                  sortingState ? JSON.stringify(sortingState) : "undefined"
                }
                onChange={ev => {
                  setSortingState(ev.target.value);
                }}
                inputProps={{
                  name: `sorting`
                }}
              >
                <MenuItem key={"undefined"} value={"undefined"} />
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
                <FormControl
                  key={`boolean-filter-${booleanFilterName}`}
                  className={classes.formControl}
                >
                  <InputLabel htmlFor={`boolean-filter-${booleanFilterName}`}>
                    {booleanFilterName}
                  </InputLabel>
                  <Select
                    value={
                      filterState[booleanFilterName] === undefined
                        ? "undefined"
                        : filterState[booleanFilterName]
                    }
                    onChange={ev => {
                      setFilterState(booleanFilterName, ev.target.value);
                    }}
                    inputProps={{
                      name: `boolean-filter-${booleanFilterName}`
                    }}
                  >
                    <MenuItem value={"undefined"} />
                    <MenuItem value={false}>No</MenuItem>
                    <MenuItem value={true}>Yes</MenuItem>
                  </Select>
                </FormControl>
              );
            })}
        </FormGroup>
      </Grid>
    </Grid>
  );
};
