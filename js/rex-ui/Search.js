// @flow

import * as React from "react";

import { InputBase, FormLabel } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import SearchIcon from "@material-ui/icons/Search";
import ClearIcon from "@material-ui/icons/Clear";

const useStyles = makeStyles(theme => {
  return {
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

type SearchProps = {|
  text: ?string,
  onChangeText: (text: string) => void,
  placeholder?: string,
  margin?: "none" | "dense",
  name?: string,
|};

export default function Search({
  text,
  onChangeText,
  placeholder,
  margin,
  name,
}: SearchProps) {
  let classes = useStyles();
  let onChange = (event: SyntheticEvent<HTMLInputElement>) => {
    onChangeText(event.currentTarget.value);
  };
  let style = {
    flex: "1 1 auto",
    fontSize: "14px",
  };
  let onClearClick = () => {
    onChangeText("");
  };
  return (
    <FormLabel className={classes.formLabel}>
      <div className={classes.search}>
        <InputBase
          placeholder={placeholder ?? "Search"}
          value={text}
          onChange={onChange}
          margin={margin ?? "none"}
          style={style}
          name={name ?? "site-search"}
          aria-label={name ?? "site-search"}
        />

        {text === "" ? (
          <div className={classes.searchIcon}>
            <SearchIcon />
          </div>
        ) : (
          <div className={classes.searchIconClickable}>
            <ClearIcon style={{ cursor: "pointer" }} onClick={onClearClick} />
          </div>
        )}
      </div>
    </FormLabel>
  );
}
