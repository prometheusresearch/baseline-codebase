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
import * as Sort from "../Sort.js";

import { ToggleButtonGroup, ToggleButton } from "@material-ui/lab";

import { makeStyles, type Theme } from "../themes.js";
import * as Field from "../Field.js";
import * as Filter from "../Filter.js";
import type { SortSpec, SortRendererProps, Params } from "./Pick";
import { DateInput } from "../../DateInput2.js";

export const useFilterToolbarStyles = makeStyles((theme: Theme) => {
  return {
    tableControl: { padding: theme.spacing.unit },
    formContainer: {
      display: "flex",
      width: "100%",
      minWidth: 120,
    },
    buttonGroupFormContainer: {
      minWidth: 120,
    },
    buttonGroupRoot: {
      display: "flex",
      flexWrap: "nowrap",
    },
    buttonGroupSelected: {
      boxShadow: "none",
    },
    dateIntervalContainer: {
      marginTop: 16,
      display: "flex",
      flexDirection: "row",
      flexWrap: "nowrap",
    },
    formControl: {
      marginLeft: theme.spacing.unit,
      flex: 1,
    },
    toggleButton: {
      borderWidth: "1px 0px 1px 1px",
      borderStyle: "solid",
      borderColor: theme.palette.grey[400],
      color: theme.palette.text.primary,
      "&:last-child": {
        borderRightWidth: 1,
      },
      whiteSpace: "nowrap",
    },
  };
});

type Props = {|
  params: Params,
  onParams: ((Params) => Params) => void,
  sorts: ?SortSpec<string>,
  isTabletWidth?: boolean,
  filters: ?Filter.FilterSpecMap,
|};

export const PickFilterToolbar = ({
  params,
  onParams,
  sorts,
  isTabletWidth,
  filters,
}: Props) => {
  let classes = useFilterToolbarStyles();

  let sortElement = null;
  if (sorts != null) {
    let sort = Sort.getSort(params);
    let onSort = sort => onParams(params => Sort.setSort(params, sort));
    let Renderer = sorts.render ?? DefaultSortRenderer;
    sortElement = (
      <Renderer sort={sort} onSort={onSort} options={sorts.options} />
    );
  }

  let elements = Array.from(filters?.values() ?? []).map(filter => {
    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={filter.name}>
        <filter.render name={filter.name} params={params} onParams={onParams} />
      </Grid>
    );
  });

  return (
    <Grid
      container
      direction="row"
      justify="flex-end"
      alignItems="center"
      className={classes.tableControl}
    >
      <Grid item xs={12}>
        <FormGroup row>
          {sorts != null && (
            <Grid item xs={12} sm={6} md={4} lg={3}>
              {sortElement}
            </Grid>
          )}

          {elements}
        </FormGroup>
      </Grid>
    </Grid>
  );
};

export function SelectFilter({
  name,
  params,
  onParams,
  label,
  options,
}: {|
  name: string,
  params: any,
  onParams: ((any) => any) => void,
  label?: string,
  options: Array<{| label: string, value: any |}>,
|}) {
  const classes = useFilterToolbarStyles();
  let value = params[name] ?? Filter.NO_VALUE;

  return (
    <div className={classes.formContainer}>
      <FormControl key={`filter-${name}`} className={classes.formControl}>
        <InputLabel htmlFor={`filter-${name}`}>
          {label || Field.guessFieldTitle(name)}
        </InputLabel>
        <Select
          value={value}
          onChange={ev => {
            let value =
              ev.target.value === Filter.NO_VALUE ? null : ev.target.value;
            onParams(params => ({ ...params, [name]: value }));
          }}
          inputProps={{
            name: `filter-${name}`,
          }}
        >
          <MenuItem value={Filter.NO_VALUE} />
          {options.map(option => {
            return (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </div>
  );
}

export function DateIntervalFilter({
  name,
  params,
  onParams,
  label,
}: {|
  name: string,
  params: any,
  onParams: ((any) => any) => void,
  label?: string,
|}) {
  const classes = useFilterToolbarStyles();
  let [startDate, endDate] = (params[name] ?? ".").split(".");

  let onStartChange = startDate => {
    onParams(params => ({
      ...params,
      [name]: (startDate ?? "") + "." + (endDate ?? ""),
    }));
  };

  let onEndChange = endDate => {
    onParams(params => ({
      ...params,
      [name]: (startDate ?? "") + "." + (endDate ?? ""),
    }));
  };

  return (
    <div className={classes.formContainer}>
      <FormControl key={`filter-${name}`} className={classes.formControl}>
        <InputLabel htmlFor={`filter-${name}`} shrink>
          {label || Field.guessFieldTitle(name)}
        </InputLabel>
        <div className={classes.dateIntervalContainer}>
          <DateInput
            value={startDate}
            onChange={onStartChange}
            placeholder="from"
          />
          <DateInput value={endDate} onChange={onEndChange} placeholder="to" />
        </div>
      </FormControl>
    </div>
  );
}

export function ButtonGroupFilter({
  name,
  params,
  onParams,
  label,
  options,
  defaultValue,
}: {|
  name: string,
  params: any,
  onParams: ((any) => any) => void,
  label?: string,
  options: Array<{| label: string, value: string |}>,
  defaultValue?: string,
|}) {
  const classes = useFilterToolbarStyles();
  let value = params[name];

  let onChange = (_ev, value) => {
    onParams(params => ({ ...params, [name]: value }));
  };

  return (
    <div className={classes.buttonGroupFormContainer}>
      <FormControl key={`filter-${name}`} className={classes.formControl}>
        <ToggleButtonGroup
          value={value ?? defaultValue}
          exclusive
          onChange={onChange}
          classes={{
            root: classes.buttonGroupRoot,
            selected: classes.buttonGroupSelected,
          }}
        >
          {options.map(option => (
            <ToggleButton
              className={classes.toggleButton}
              key={option.value}
              value={option.value}
            >
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FormControl>
    </div>
  );
}

function DefaultSortRenderer({ sort, onSort, options }: SortRendererProps) {
  const classes = useFilterToolbarStyles();
  return (
    <div className={classes.formContainer}>
      <FormControl className={classes.formControl}>
        <InputLabel htmlFor={`sorting`}>{"Sorting"}</InputLabel>
        <Select
          value={Sort.toString(sort) ?? Filter.NO_VALUE}
          onChange={ev => {
            let value = ev.target.value;
            if (value === Filter.NO_VALUE) {
              onSort(null);
            } else {
              onSort(Sort.ofString(value));
            }
          }}
          inputProps={{
            name: `sorting`,
          }}
        >
          <MenuItem key={Filter.NO_VALUE} value={Filter.NO_VALUE} />
          {options.map((option, index) => {
            let title =
              option.title ??
              `${option.field}, ${option.desc ? "desc" : "asc"}`;
            return (
              <MenuItem
                key={index}
                value={
                  Sort.toString({
                    field: option.field,
                    desc: option.desc ?? false,
                  }) ?? Filter.NO_VALUE
                }
              >
                {title}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </div>
  );
}
