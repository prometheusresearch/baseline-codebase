/**
 * @flow
 */
import * as React from "react";

import Grid from "@material-ui/core/Grid";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormGroup from "@material-ui/core/FormGroup";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";

import { type PickState } from "./PickRenderer";

import * as Field from "./Field.js";
import * as Filter from "./Filter.js";

import { makeStyles, type Theme } from "@material-ui/styles";
import { DEFAULT_THEME } from "./themes";
import { isEmptyObject } from "./helpers";

export const useFilterStyles = makeStyles((theme: Theme) => {
  if (theme.palette == null || isEmptyObject(theme)) {
    theme = DEFAULT_THEME;
  }

  return {
    tableControl: {
      padding: "16px",
    },
    formControl: {
      minWidth: 120,
      marginBottom: 24,
      width: "100%",
      paddingRight: 16,
    },
  };
});

type Props = {|
  state: PickState,
  sortingConfig: ?Array<{| desc: boolean, field: string |}>,
  setFilterState: (name: string, value: ?boolean) => void,
  setSortingState: (value: string) => void,
  isTabletWidth?: boolean,
  filterSpecs: ?Filter.FilterSpecMap,
|};

const PickFilterToolbarBase = ({
  state,
  sortingConfig,
  setFilterState,
  setSortingState,
  isTabletWidth,
  filterSpecs,
}: Props) => {
  const classes = useFilterStyles();

  const classNames = [classes.tableControl];

  let CustomSortRenderer: ?React.ComponentType<{
    onChange: (newValue: any) => void,
    value: any,
    values?: Array<any>,
  }> = null;
  if (filterSpecs != null) {
    let sort = filterSpecs.get(Filter.SORT_FIELD);
    if (sort != null) {
      if (sort.render != null) {
        CustomSortRenderer = sort.render;
      }
    }
  }
  const SortRenderer =
    sortingConfig == null ? null : CustomSortRenderer ? (
      <CustomSortRenderer
        onChange={(newValue: string) => {
          setSortingState(newValue);
        }}
        value={state.sort ? JSON.stringify(state.sort) : Filter.NO_VALUE}
        values={[Filter.NO_VALUE, ...(sortingConfig || [])]}
      />
    ) : (
      <FormControl className={classes.formControl}>
        <InputLabel htmlFor={`sorting`}>{"Sorting"}</InputLabel>
        <Select
          value={state.sort ? JSON.stringify(state.sort) : Filter.NO_VALUE}
          onChange={ev => {
            setSortingState(ev.target.value);
          }}
          inputProps={{
            name: `sorting`,
          }}
        >
          <MenuItem key={Filter.NO_VALUE} value={Filter.NO_VALUE} />
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
    <Grid
      container
      direction="row"
      justify="flex-end"
      alignItems="center"
      className={classNames.join(" ")}
    >
      <Grid item xs={12}>
        <FormGroup row>
          {sortingConfig != null ? (
            <Grid item xs={6} sm={4} md={3} lg={2}>
              {SortRenderer}
            </Grid>
          ) : null}

          {filterSpecs
            ? Array.from(filterSpecs.keys()).map((booleanFilterName, index) => {
                let CustomBooleanRenderer: ?React.ComponentType<{
                  onChange: (newValue: any) => void,
                  value: any,
                  values?: Array<any>,
                }> = null;

                if (filterSpecs != null) {
                  if (filterSpecs.get(booleanFilterName) != null) {
                    // $FlowFixMe
                    if (filterSpecs.get(booleanFilterName).render != null) {
                      // $FlowFixMe
                      CustomBooleanRenderer = (filterSpecs.get(
                        booleanFilterName,
                      ).render: any);
                    }
                  }
                }

                return filterSpecs == null ||
                  (filterSpecs.get(booleanFilterName) != null &&
                    //$FlowFixMe
                    filterSpecs.get(booleanFilterName).render == null) ? (
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
              })
            : null}
        </FormGroup>
      </Grid>
    </Grid>
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
  const classes = useFilterStyles();

  return (
    <FormControl key={`boolean-filter-${name}`} className={classes.formControl}>
      <InputLabel htmlFor={`boolean-filter-${name}`}>
        {label || Field.guessFieldTitle(name)}
      </InputLabel>
      <Select
        value={value == null ? Filter.NO_VALUE : value}
        onChange={ev => {
          onValue(ev.target.value === Filter.NO_VALUE ? null : ev.target.value);
        }}
        inputProps={{
          name: `boolean-filter-${name}`,
        }}
      >
        <MenuItem value={Filter.NO_VALUE} />
        <MenuItem value={false}>No</MenuItem>
        <MenuItem value={true}>Yes</MenuItem>
      </Select>
    </FormControl>
  );
}

export const PickFilterToolbar = (props: Props) => {
  return <PickFilterToolbarBase {...props} />;
};
