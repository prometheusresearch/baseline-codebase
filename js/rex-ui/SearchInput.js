/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactDOM from "react-dom";

import * as mui from "@material-ui/core";
import * as styles from "@material-ui/styles";
import * as icons from "@material-ui/icons";

import { TextInput } from "./TextInput";

function isEmpty(value) {
  return value == null || value == "";
}

let useStyles = styles.makeStyles(theme => ({
  root: {
    display: "flex !important",
    flexDirection: "row !important",
    alignItems: "center !important",
  },
  input: {
    marginLeft: 8,
    flex: 1,
  },
  iconButton: {
    padding: 10,
  },
}));

type Props = {|
  placeholder?: string,
  debounce?: number,
  value: null | string,
  onChange: (null | string) => void,
|};

export function SearchInput(props: Props) {
  let { placeholder = "Search...", debounce = 1000, value, onChange } = props;

  let classes = useStyles();

  let [focus, setFocus] = React.useState(false);
  let onFocus = () => setFocus(true);
  let onBlur = () => setFocus(false);

  let inputRef = React.useRef(null);

  let onClear = () => {
    onChange(null);
    focusInput();
  };

  let focusInput = () => {
    if (inputRef.current != null) {
      inputRef.current.focus();
    }
  };

  return (
    <mui.Card>
      <mui.FormControl
        fullWidth
        variant="filled"
        classes={{ root: classes.root }}
      >
        <mui.IconButton
          className={classes.iconButton}
          aria-label="Search"
          onClick={focusInput}
        >
          <icons.Search />
        </mui.IconButton>
        <TextInput
          Component={mui.InputBase}
          ref={inputRef}
          onFocus={onFocus}
          onBlur={onBlur}
          className={classes.input}
          placeholder={placeholder}
          onChange={onChange}
          value={value}
        />
        {!isEmpty(value) && (
          <mui.IconButton
            onClick={onClear}
            className={classes.iconButton}
            aria-label="close"
          >
            <icons.Close />
          </mui.IconButton>
        )}
      </mui.FormControl>
    </mui.Card>
  );
}
