// @flow

import * as React from "react";
import * as mui from "@material-ui/core";

import { makeStyles } from "@material-ui/styles";
import Grid from "@material-ui/core/Grid";
import ButtonBase from "@material-ui/core/ButtonBase";
import Checkbox from "@material-ui/core/Checkbox";

import ScrollView from "../../ScrollView.js";
import SelectAllCheckbox from "../SelectAllCheckbox.js";
import { ShowRenderer } from "../ShowRenderer.js";
import type { PickDataViewProps } from "./PickRenderer.js";

export function PickCardListView<O: { id: string, [key: string]: mixed }>({
  data,
  fields,
  onSelect,
  onSelectMany,
  onSelected,
  selected,
}: PickDataViewProps<O>) {
  let classes = useStyles();

  let onClick = (ev: UIEvent) => {
    ev.stopPropagation();
  };

  let onCheckedAll = (ev: UIEvent) => {
    let checked = (ev.target: any).checked;
    let nextSelected = new Set(selected);
    if (checked) {
      data.forEach(row => {
        nextSelected.add(row.id);
      });
    } else {
      data.forEach(row => {
        nextSelected.delete(row.id);
      });
    }
    onSelected(nextSelected);
    if (onSelectMany) {
      onSelectMany(data.filter(row => nextSelected.has(row.id)));
    }
  };

  return (
    <>
      {onSelectMany && (
        <mui.FormControlLabel
          control={
            <SelectAllCheckbox
              selected={selected}
              data={data}
              onCheckedAll={onCheckedAll}
            />
          }
          label="Select All"
          classes={{ root: classes.SelectAll__root }}
        />
      )}
      <ScrollView>
        <Grid container>
          {data.map((row, index) => {
            let onShowClick = () => {
              if (onSelect) {
                onSelect(row);
              } else if (onSelectMany) {
                let checked = !selected.has(row.id);
                let nextSelected = new Set(selected);
                if (checked) {
                  nextSelected.add(row.id);
                } else {
                  nextSelected.delete(row.id);
                }
                onSelected(nextSelected);
                let rows = data.filter(row => nextSelected.has(row.id));
                onSelectMany(rows);
              }
            };
            let onChecked = (ev: UIEvent) => {
              let checked = (ev.target: any).checked;
              let nextSelected = new Set(selected);
              if (checked) {
                nextSelected.add(row.id);
              } else {
                nextSelected.delete(row.id);
              }
              onSelected(nextSelected);
              let rows = data.filter(row => nextSelected.has(row.id));
              onSelectMany != null && onSelectMany(rows);
            };
            return (
              <Grid
                key={index}
                item
                xs={12}
                md={6}
                lg={4}
                style={{
                  padding: 8,
                }}
              >
                <ButtonBase className={classes.buttonBase} component={"div"}>
                  {onSelectMany && (
                    <div className={classes.checkboxContainer}>
                      <Checkbox
                        onClick={onClick}
                        onChange={onChecked}
                        checked={selected.has(row.id)}
                      />
                    </div>
                  )}
                  <ShowRenderer
                    onClick={onShowClick}
                    noHoverOpacity
                    data={row}
                    fields={fields}
                  />
                </ButtonBase>
              </Grid>
            );
          })}
        </Grid>
      </ScrollView>
    </>
  );
}

let useStyles = makeStyles(theme => ({
  SelectAll__root: {
    marginLeft: 0,
  },
  checkboxContainer: {
    position: "absolute",
    top: theme.spacing(0.5),
    right: theme.spacing(0.5),
  },
  buttonBase: {
    width: "100%",
  },
}));
