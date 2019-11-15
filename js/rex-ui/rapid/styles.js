/**
 * @flow
 */
import { makeStyles } from "@material-ui/styles";

import {
  createMuiTheme,
  MuiThemeProvider,
  type Theme
} from "@material-ui/core/styles";
import { DEFAULT_THEME } from "./themes";
import { isEmptyObject } from "./helpers";

export const usePickStyles = makeStyles(
  (theme: Theme) => {
    if (theme.palette == null || isEmptyObject(theme)) {
      theme = DEFAULT_THEME;
    }

    return {
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
      tableCell: {
        color: "inherit",
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
      tableHead: {
        background: "white",
        position: "sticky",
        top: 0,
        color: "inherit",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden"
      },
      tableHeadSortable: {
        cursor: "pointer",
        "&:hover": {
          backgroundColor: theme.palette.primary.dark,
          color: "white"
        }
      },
      tableHeadSorted: {
        backgroundColor: theme.palette.primary.main,
        color: "white"
      },
      tableRow: {
        color: theme.palette.text.primary
      },
      tableRowClickable: {
        "&&&:hover": {
          background: theme.palette.primary.light,
          color: theme.palette.primary.contrastText
        }
      },
      tableWrapper: {
        overflowY: "scroll",
        flex: "1 1 auto"
      },
      title: {
        marginBottom: "8px"
      },
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
      filterIconButton: {
        color: theme.palette.text.primary,
        "&:hover": {
          color: theme.palette.primary.contrastText,
          background: theme.palette.primary.light
        }
      },
      filterIconButtonActive: {
        background: theme.palette.primary.light,
        color: theme.palette.primary.contrastText,
        "&:hover": {
          color: theme.palette.primary.contrastText,
          background: theme.palette.primary.dark
        }
      },
      rendererRoot: {
        maxWidth: "100%",
        margin: 0
      }
    };
  },
);
