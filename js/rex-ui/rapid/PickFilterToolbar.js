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
import {
  type PickState,
  type FiltersConfig,
  type FilterSpecMap,
  SORTING_VAR_NAME,
  SEARCH_VAR_NAME,
} from "./PickRenderer";
import { usePickStyles } from "./styles.js";
import * as Field from "./Field.js";
import { useTheme } from "@material-ui/styles";
import { MuiThemeProvider } from "@material-ui/core";

export const PickFilterToolbar = ({
  variableDefinitions,
  state,
  sortingConfig,
  setFilterState,
  setSortingState,
  setSearchState,
  isTabletWidth,
  filtersSpecs,
}: {|
  state: PickState,
  variableDefinitions: VariableDefinitionNode[] | void,
  sortingConfig: ?Array<{| desc: boolean, field: string |}>,
  setSearchState: (val: string) => void,
  setFilterState: (name: string, value: ?boolean) => void,
  setSortingState: (value: string) => void,
  isTabletWidth?: boolean,
  filtersSpecs: ?FilterSpecMap,
|}) => {
  if (variableDefinitions == null) {
    return null;
  }

  const theme = useTheme();

  const classes = usePickStyles();

  const classNames = [classes.tableControl];

  let CustomSearchRenderer: ?React.ComponentType<{
    onChange: (newValue: any) => void,
    value: any,
    values?: Array<any>,
  }> = null;
  if (filtersSpecs != null) {
    if (filtersSpecs.get(SEARCH_VAR_NAME) != null) {
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
          label="Search"
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

  let CustomSortRenderer: ?React.ComponentType<{
    onChange: (newValue: any) => void,
    value: any,
    values?: Array<any>,
  }> = null;
  if (filtersSpecs != null) {
    if (filtersSpecs.get(SORTING_VAR_NAME) != null) {
      // $FlowFixMe
      if (filtersSpecs.get(SORTING_VAR_NAME).render != null) {
        // $FlowFixMe
        CustomSortRenderer = (filtersSpecs.get(SORTING_VAR_NAME).render: any);
      }
    }
  }
  const SortRenderer =
    sortingConfig == null ? null : CustomSortRenderer ? (
      <CustomSortRenderer
        onChange={(newValue: string) => {
          setSortingState(newValue);
        }}
        value={state.sort ? JSON.stringify(state.sort) : Field.FILTER_NO_VALUE}
        values={[Field.FILTER_NO_VALUE, ...(sortingConfig || [])]}
      />
    ) : (
      <FormControl className={classes.formControl}>
        <InputLabel htmlFor={`sorting`}>{"Sorting"}</InputLabel>
        <Select
          value={
            state.sort ? JSON.stringify(state.sort) : Field.FILTER_NO_VALUE
          }
          onChange={ev => {
            setSortingState(ev.target.value);
          }}
          inputProps={{
            name: `sorting`,
          }}
        >
          <MenuItem key={Field.FILTER_NO_VALUE} value={Field.FILTER_NO_VALUE} />
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
    );

  return (
    <MuiThemeProvider theme={theme}>
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
              <Grid item xs={6} sm={4} md={3} lg={2}>
                {SearchRenderer}
              </Grid>
            ) : null}

            {sortingConfig != null ? (
              <Grid item xs={6} sm={4} md={3} lg={2}>
                {SortRenderer}
              </Grid>
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
              .map((varDef, index) => {
                const booleanFilterName = varDef.variable.name.value;

                let CustomBooleanRenderer: ?React.ComponentType<{
                  onChange: (newValue: any) => void,
                  value: any,
                  values?: Array<any>,
                }> = null;
                if (filtersSpecs != null) {
                  if (filtersSpecs.get(booleanFilterName) != null) {
                    // $FlowFixMe
                    if (filtersSpecs.get(booleanFilterName).render != null) {
                      // $FlowFixMe
                      CustomBooleanRenderer = (filtersSpecs.get(
                        booleanFilterName,
                      ).render: any);
                    }
                  }
                }

                return filtersSpecs == null ? (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
                    <BooleanFilter
                      key={booleanFilterName}
                      value={state.filter[booleanFilterName]}
                      onValue={value =>
                        setFilterState(booleanFilterName, value)
                      }
                      name={booleanFilterName}
                    />
                  </Grid>
                ) : CustomBooleanRenderer ? (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
                    <CustomBooleanRenderer
                      key={booleanFilterName}
                      value={state.filter[booleanFilterName]}
                      onChange={value =>
                        setFilterState(booleanFilterName, value)
                      }
                    />
                  </Grid>
                ) : null;
              })}
          </FormGroup>
        </Grid>
      </Grid>
    </MuiThemeProvider>
  );
};

function BooleanFilter({
  name,
  label,
  value,
  onValue,
}: {|
  value: ?boolean,
  onValue: (?boolean) => void,
  label?: string,
  name: string,
|}) {
  const classes = usePickStyles();

  return (
    <FormControl key={`boolean-filter-${name}`} className={classes.formControl}>
      <InputLabel htmlFor={`boolean-filter-${name}`}>
        {label || Field.guessFieldTitle(name)}
      </InputLabel>
      <Select
        value={value == null ? Field.FILTER_NO_VALUE : value}
        onChange={ev => {
          onValue(
            ev.target.value === Field.FILTER_NO_VALUE ? null : ev.target.value,
          );
        }}
        inputProps={{
          name: `boolean-filter-${name}`,
        }}
      >
        <MenuItem value={Field.FILTER_NO_VALUE} />
        <MenuItem value={false}>No</MenuItem>
        <MenuItem value={true}>Yes</MenuItem>
      </Select>
    </FormControl>
  );
}
