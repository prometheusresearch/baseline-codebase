/**
 * Autocomplete component based on top of react-autosuggest library and styled
 * with material ui.
 *
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import Autosuggest from "react-autosuggest";
import match from "autosuggest-highlight/match";
import parse from "autosuggest-highlight/parse";
import * as mui from "@material-ui/core";
import * as styles from "@material-ui/styles";
import * as icons from "@material-ui/icons";
import { type Theme } from "./Theme.js";
import * as ReactUtil from "./ReactUtil.js";

export type RenderInput = ({
  item: Item,
  value: string,
  onChange: string => void
}) => React.Node;

export type RenderSuggestion = (
  item: Item,
  { query: string, isHighlighted: boolean }
) => React.Node;

/** Params passed to search function. */
export type SearchParams = {
  value: string,
  reason: string
};

/** Callback used to return results (or an error) to a an Autocomplete. */
export type SearchCallback = (err: ?Error, items: ?(Item[])) => void;

/** Autocomplete item. */
export type Item = {
  id: string,
  title: string
};

let noopRef = _node => {};

type InputProps = {
  ref: React.Ref<React.AbstractComponent<{}>>,
  inputRef: React.Ref<React.AbstractComponent<{}>>
};

export let Input = React.forwardRef<InputProps, HTMLElement>((props, ref) => {
  let { inputRef = noopRef, ...other } = props;
  let classes = useStyles();

  return (
    <mui.Input
      {...other}
      fullWidth
      inputRef={node => {
        ReactUtil.setReactRef(ref, node);
        ReactUtil.setReactRef(inputRef, node);
      }}
    />
  );
});

function renderInputDefault(inputProps) {
  return <Input {...inputProps} />;
}

export function Suggestion(props: {
  item: Item,
  query: string,
  isHighlighted: boolean,
  endAdornment?: React.Node,
  startAdornment?: React.Node
}) {
  const matches = match(props.item.title, props.query);
  const parts = parse(props.item.title, matches);

  return (
    <mui.MenuItem selected={props.isHighlighted} component="div">
      {props.startAdornment}
      <div>
        {parts.map((part, index) =>
          part.highlight ? (
            <span key={String(index)} style={{ fontWeight: 500 }}>
              {part.text}
            </span>
          ) : (
            <strong key={String(index)} style={{ fontWeight: 300 }}>
              {part.text}
            </strong>
          )
        )}
      </div>
      {props.endAdornment}
    </mui.MenuItem>
  );
}

let renderSuggestionDefault = (item: Item, { query, isHighlighted }) => {
  return <Suggestion item={item} query={query} isHighlighted={isHighlighted} />;
};

function getSuggestionValue(item: Item) {
  return item.title;
}

let useStyles = styles.makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1
  },
  error: {
    fontSize: "10pt",
    color: theme.palette.error.main,
    padding: theme.spacing.unit
  },
  container: {
    position: "relative"
  },
  suggestionsContainerOpen: {
    position: "absolute",
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0
  },
  suggestion: {
    display: "block"
  },
  suggestionsList: {
    margin: 0,
    padding: 0,
    listStyleType: "none"
  },
  divider: {
    height: theme.spacing.unit * 2
  }
}));

type Props = {
  value: ?Item,
  onChange: (?Item) => void,
  error?: boolean,
  placeholder?: string,
  search: (SearchParams, SearchCallback) => void,
  renderSuggestion?: RenderSuggestion,
  renderInput?: RenderInput
};

export let AutocompleteLoading = React.forwardRef<{}, {}>((props: {}, ref) => {
  let endAdornment = (
    <div style={{ marginRight: 14 }}>
      <mui.CircularProgress size={16} />
    </div>
  );
  return (
    <mui.Input inputRef={ref} disabled readOnly endAdornment={endAdornment} />
  );
});

type Suggestions =
  | { type: "suggestions", items: Item[] }
  | { type: "error", error: Error };

export let Autocomplete = React.forwardRef<Props, HTMLElement>(
  (props: Props, ref) => {
    let {
      placeholder,
      search,
      value,
      renderSuggestion = renderSuggestionDefault,
      renderInput = renderInputDefault
    } = props;
    let [query, setQuery] = React.useState(value != null ? value.title : "");
    let [suggestions, setSuggestions] = React.useState<Suggestions>({
      type: "suggestions",
      items: []
    });

    let cb = (error, items) => {
      if (error != null) {
        setSuggestions({ type: "error", error });
      } else {
        setSuggestions({ type: "suggestions", items: items || [] });
      }
    };

    let onSuggestionsFetchRequested = (params: SearchParams) => {
      search(params, cb);
    };

    let onSuggestionsClearRequested = () => {
      setSuggestions({ type: "suggestions", items: [] });
    };

    let onSuggestionSelected = (_ev, { suggestion: item }) => {
      props.onChange(item);
    };

    let shouldRenderSuggestions = () => true;

    let onChange = (event, { newValue }) => {
      setQuery(newValue);
    };

    let onClear = () => {
      setQuery("");
      props.onChange(null);
    };

    let onBlur = () => {
      if (query === "") {
        props.onChange(null);
      } else {
        setQuery(value != null ? value.title : "");
      }
    };

    let classes = useStyles();

    let popperNode = React.useRef(null);
    let inputNode = React.useRef(null);

    let endAdornment = (
      <div>
        {query !== "" && (
          <mui.IconButton
            style={{ padding: 3, marginRight: 6 }}
            onClick={onClear}
          >
            <icons.Close fontSize="small" />
          </mui.IconButton>
        )}
      </div>
    );

    return (
      <div style={{ marginTop: 16 }}>
        <Autosuggest
          renderInputComponent={renderInput}
          suggestions={
            suggestions.type === "suggestions" ? suggestions.items : []
          }
          focusInputOnSuggestionClick={true}
          onSuggestionsFetchRequested={onSuggestionsFetchRequested}
          onSuggestionsClearRequested={onSuggestionsClearRequested}
          onSuggestionSelected={onSuggestionSelected}
          getSuggestionValue={getSuggestionValue}
          shouldRenderSuggestions={shouldRenderSuggestions}
          renderSuggestion={renderSuggestion}
          inputProps={{
            inputRef: node => {
              ReactUtil.setReactRef(popperNode, node);
              ReactUtil.setReactRef(inputNode, node);
              ReactUtil.setReactRef(ref, node);
            },
            error: props.error,
            placeholder,
            value: query,
            onChange: onChange,
            onBlur: onBlur,
            endAdornment,
            item: props.value
          }}
          theme={{
            suggestionsList: classes.suggestionsList,
            suggestion: classes.suggestion
          }}
          renderSuggestionsContainer={options => {
            return (
              <mui.Popper
                style={{ zIndex: 1 }}
                anchorEl={popperNode.current}
                open={Boolean(options.children)}
              >
                <mui.Paper
                  {...options.containerProps}
                  square
                  style={{
                    overflow: "auto",
                    backgroundColor: "#ffffff",
                    maxHeight: 200,
                    width: popperNode.current
                      ? popperNode.current.clientWidth
                      : undefined
                  }}
                >
                  {options.children}
                </mui.Paper>
              </mui.Popper>
            );
          }}
        />
        {suggestions.type === "error" ? (
          <div className={classes.error}>
            Unable to fetch available options due to an error
          </div>
        ) : null}
      </div>
    );
  }
);
