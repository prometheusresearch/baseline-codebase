/**
 * @flow
 */
import { makeStyles } from "@material-ui/styles";

const DEFAULT_TEXT_COLOR = "rgba(0, 0, 0, 0.87)";

export const useStyles = makeStyles({
  center: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  root: {
    width: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    maxHeight: "100vh",
    height: "100vh",
    display: "flex",
    flexDirection: "column"
  },
  table: {
    minWidth: "100%",
    tableLayout: "fixed"
  },
  tableFullHeight: {
    minHeight: "100%"
  },
  tableControl: {
    padding: "16px"
  },
  paginationWrapper: {
    position: "relative",
    zIndex: "5",
    padding: 8,
    boxShadow: "0 0 10px -8px",
    margin: 0,
    width: "100%",
    flex: "0 0 auto"
  },
  formControl: {
    minWidth: 120,
    marginBottom: 24,
    width: "100%",
    paddingRight: 16
  },
  tableHead: {
    background: "white",
    position: "sticky",
    top: 0,
    color: DEFAULT_TEXT_COLOR,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden"
  },
  tableHeadSortable: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "rgb(66,66,66)",
      color: "white"
    }
  },
  tableHeadSorted: {
    backgroundColor: "rgb(128,128,128)",
    color: "white"
  },
  tableWrapper: {
    overflowY: "scroll",
    flex: "1 1 auto"
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
  topPartWrapperMobile: {
    boxShadow: "0 0 10px -8px"
  },
  tableCell: {
    color: DEFAULT_TEXT_COLOR,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden"
  },
  tableCellContentWrapper: {
    paddingRight: 24,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden"
  },
  tableCellSortIcon: {
    position: "absolute",
    top: 16,
    right: 6
  },
  filterIconButtonActive: {
    background: "rgba(0,0,0,0.1)"
  },
  rendererRoot: {
    maxWidth: "100%",
    margin: 0
  }
});
