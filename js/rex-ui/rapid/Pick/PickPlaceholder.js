// @flow

import * as React from "react";

import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/styles";

import { LoadingIndicator } from "../LoadingIndicator";

const useDataViewStyles = makeStyles(theme => {
  return {
    center: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };
});

type PickPlaceholderProps = {|
  loading?: boolean,
  text?: string,
  colSpan?: number,
|};

export function PickPlaceholder({
  colSpan,
  loading,
  text,
}: PickPlaceholderProps) {
  let classes = useDataViewStyles();

  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={colSpan}>
          <div className={classes.center}>
            {loading ? (
              <LoadingIndicator />
            ) : (
              <Typography variant={"caption"}>{text ?? "No data"}</Typography>
            )}
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}
