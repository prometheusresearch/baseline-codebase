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
import FormLabel from "@material-ui/core/FormLabel";

import { type VariableDefinitionNode } from "graphql/language/ast";
import { type PickState, SEARCH_VAR_NAME } from "./PickRenderer";

import * as Field from "./Field.js";

import { makeStyles, type Theme, useTheme } from "@material-ui/styles";
import SearchIcon from "@material-ui/icons/Search";
import ClearIcon from "@material-ui/icons/Clear";

import { DEFAULT_THEME } from "./themes";
import { isEmptyObject, capitalize } from "./helpers";
import { IconButton, InputBase } from "@material-ui/core";

export const useFilterStyles = makeStyles((theme: Theme) => {
  if (theme.palette == null || isEmptyObject(theme)) {
    theme = DEFAULT_THEME;
  }

  return {
    tableControl: {},
    formLabel: {
      display: "block",
    },
    search: {
      position: "relative",
      borderRadius: "50px",
      padding: "10px 16px",
      backgroundColor: "white",
      boxShadow: "0px 2px 4px 0px rgba(0,0,0,0.15)",
      "&:hover": {
        boxShadow: "0px 2px 2px 0px rgba(0,0,0,0.1)",
      },
      transition: "box-shadow 0.2s",
      marginLeft: 0,
      width: "100%",
      display: "flex",
    },
    searchIcon: {
      width: 32,
      pointerEvents: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    searchIconClickable: {
      width: 32,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };
});

type Props = {|
  state: PickState,
  setSearchState: (val: string) => void,
  filterSpecs: ?Field.FilterSpecMap,
|};

const PickSearchToolbarBase = ({
  state,
  setSearchState,
  filterSpecs,
}: Props) => {
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
      <FormLabel className={classes.formLabel}>
        <div className={classes.search}>
          <InputBase
            placeholder={"Search"}
            value={state.searchText}
            onChange={ev => {
              setSearchState(ev.target.value);
            }}
            margin={"none"}
            InputLabelProps={{
              shrink: true,
            }}
            style={{
              flex: "1 1 auto",
              fontSize: "14px",
            }}
            name={"site-search"}
          />

          {state.searchText == "" ? (
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
          ) : (
            <div className={classes.searchIconClickable}>
              <ClearIcon
                style={{ cursor: "pointer" }}
                onClick={() => setSearchState("")}
              />
            </div>
          )}
        </div>
      </FormLabel>
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
