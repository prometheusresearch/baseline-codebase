/**
 * @flow
 */
import { makeStyles } from "@material-ui/styles";

export const useStyles = makeStyles({
  root: {
    width: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    maxHeight: "100vh",
    display: "flex",
    flexDirection: "column"
  },
  table: {
    minWidth: 1280,
    tableLayout: "fixed"
  },
  tableControl: {
    padding: "16px"
  },
  paginationWrapper: {
    position: "relative",
    zIndex: "5",
    padding: "16px",
    boxShadow: "0 0 10px -8px",
    margin: 0,
    width: "100%"
  },
  formControl: {
    minWidth: 120,
    marginLeft: 16
  },
  tableHead: {
    background: "white",
    position: "sticky",
    top: 0
  },
  tableHeadSortable: {
    cursor: "pointer",
    "&:hover": {
      boxShadow: "0 5px 0px -4px"
    }
  },
  tableHeadSorted: {
    boxShadow: "0 5px 0px -4px"
  },
  tableWrapper: {
    overflowY: "scroll"
  },
  title: {
    marginBottom: "8px"
  },
  description: {},
  topPart: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "16px"
  },
  topPartWrapper: {
    position: "relative",
    zIndex: "10"
  },
  tableCell: {
    wordBreak: "break-word"
  },
  tableCellContentWrapper: {
    display: "relative",
    paddingRight: 24
  },
  tableCellSortIcon: {
    position: "absolute",
    top: 16,
    right: 6
  },
  filterIconButtonActive: {
    background: "rgba(0,0,0,0.1)"
  }
});
