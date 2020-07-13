/**
 * @flow
 */

import * as React from "react";

import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";

import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";

import { makeStyles, type Theme } from "../../Theme.js";

export const usePaginationStyles = makeStyles((theme: Theme) => ({
  paginationWrapper: {
    position: "relative",
    boxShadow: "0 0 10px -8px",
    margin: 0,
    width: "100%",
    flex: "0 0 auto",
  },
}));

export const PickPagination = ({
  hasNext,
  hasPrev,
  onNextPage,
  onPrevPage,
}: {|
  hasNext: boolean,
  hasPrev: boolean,
  onNextPage: () => void,
  onPrevPage: () => void,
|}) => {
  const classes = usePaginationStyles();

  return (
    <Grid
      data-testid="pick-pagination"
      container
      direction="row"
      justify="flex-end"
      alignItems="center"
      spacing={8}
      className={classes.paginationWrapper}
    >
      <Grid item>
        <IconButton
          aria-label="previous"
          color="default"
          onClick={onPrevPage}
          disabled={!hasPrev}
        >
          <ChevronLeftIcon />
        </IconButton>

        <IconButton
          aria-label="next"
          color="default"
          onClick={onNextPage}
          disabled={!hasNext}
        >
          <ChevronRightIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
};
