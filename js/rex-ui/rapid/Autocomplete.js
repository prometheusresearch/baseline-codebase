/**
 * @flow
 */

import * as React from "react";
import * as ReactDOM from "react-dom";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource2";
import * as mui from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import Autosuggest from "react-autosuggest";
import match from "autosuggest-highlight/match";
import parse from "autosuggest-highlight/parse";

import * as Field from "./Field.js";

export type AutocompleteProps<V, R, O = *> = {|
  /** GraphQL endpoint. */
  endpoint: Endpoint,
  resource: Resource.Resource<V, R>,
  getRows: R => ?Array<?O>,

  /** Field which specifies the label. */
  labelField: Field.FieldConfig<O, $Keys<O>>,
  /** Additional fields to query. */
  fields?: Array<Field.FieldConfig<O, $Keys<O>>>,

  /** Currently selected value. */
  value: ?Object,
  /** Called when user selects a new value. */
  onValue: (?Object) => void,

  /** Field label. */
  label?: string,
  /** Field placeholder. */
  placeholder?: string,
  /** This allows to specify a component which is used to render an item. */
  RenderItem?: React.AbstractComponent<{| label: React.Node, item: Object |}>,
|};

export let Autocomplete = <V, R>(props: AutocompleteProps<V, R>) => {
  let {
    endpoint,
    resource,
    getRows,
    labelField: labelField_,
    value,
    onValue,
    label,
    placeholder,
    RenderItem,
  } = props;
  let labelField = Field.configureField(labelField_);

  return (
    <AutocompleteRenderer
      endpoint={endpoint}
      resource={resource}
      getRows={getRows}
      labelField={labelField}
      label={label}
      placeholder={placeholder}
      value={value}
      onValue={onValue}
      RenderItem={RenderItem}
    />
  );
};

let useStyles = makeStyles(theme => ({
  root: {
    height: 250,
    flexGrow: 1,
  },
  container: {
    position: "relative",
  },
  suggestionsContainerOpen: {
    position: "absolute",
    zIndex: 1,
    marginTop: theme.spacing(),
    left: 0,
    right: 0,
  },
  suggestion: {
    display: "block",
  },
  suggestionsList: {
    margin: 0,
    padding: 0,
    listStyleType: "none",
  },
  divider: {
    height: theme.spacing(2),
  },
}));

type AutocompleteRendererProps<V, R, O = *> = {|
  endpoint: Endpoint,
  resource: Resource.Resource<V, R>,
  getRows: R => ?Array<?O>,
  labelField: Field.FieldSpec,
  label?: string,
  placeholder?: string,
  value: ?Object,
  onValue: (?Object) => void,
  RenderItem?: React.AbstractComponent<{| label: React.Node, item: Object |}>,
|};

let AutocompleteRenderer = <V: Object, R>(
  props: AutocompleteRendererProps<V, R>,
) => {
  let {
    endpoint,
    resource,
    getRows,
    label,
    placeholder,
    labelField,
    value,
    onValue,
    RenderItem,
  } = props;

  let popperNode = React.useRef<?HTMLElement>(null);
  let [search, setSearch] = React.useState(
    value != null ? Field.extract(labelField, value) : "",
  );
  let [suggestions, setSuggestions] = React.useState([]);

  let onSuggestionsFetchRequested = ({ value }) => {
    let params: Object = {
      search: value,
    };
    Resource.fetch(endpoint, resource, params).then(data => {
      setSuggestions(getRows(data));
    });
  };

  let onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  let onSuggestionSelected = (event, { suggestion }) => {
    onValue(suggestion);
  };

  let handleChange = (event, { newValue }) => {
    setSearch(newValue);
  };

  let classes = useStyles();

  function renderInputComponent(inputProps) {
    let { classes, inputRef = node => {}, ref, ...other } = inputProps;

    return (
      <mui.TextField
        fullWidth
        InputProps={{
          inputRef: node => {
            if (node != null) {
              ref(node);
              inputRef(node);
            }
          },
          classes: {
            input: classes.input,
          },
        }}
        {...other}
      />
    );
  }

  function renderSuggestion(suggestion, { query, isHighlighted }) {
    let label = Field.extract(labelField, suggestion);
    let matches = match(label, query);
    let parts = parse(label, matches);

    let labelNode = (
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
          ),
        )}
      </div>
    );

    let node = labelNode;
    if (RenderItem != null) {
      node = <RenderItem label={labelNode} item={suggestion} />;
    }

    return (
      <mui.MenuItem selected={isHighlighted} component="div">
        {node}
      </mui.MenuItem>
    );
  }

  function getSuggestionValue(suggestion) {
    return Field.extract(labelField, suggestion);
  }

  return (
    <div className={classes.root}>
      <Autosuggest
        renderInputComponent={renderInputComponent}
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        onSuggestionSelected={onSuggestionSelected}
        renderSuggestion={renderSuggestion}
        inputProps={{
          classes,
          label,
          placeholder,
          value: search,
          onChange: handleChange,
          inputRef: node => {
            if (node != null) {
              popperNode.current = (ReactDOM.findDOMNode(node): any);
            }
          },
          InputLabelProps: {
            shrink: true,
          },
        }}
        theme={{
          suggestionsList: classes.suggestionsList,
          suggestion: classes.suggestion,
        }}
        renderSuggestionsContainer={options => (
          <mui.Popper anchorEl={popperNode.current} open={true}>
            <mui.Paper
              square
              {...options.containerProps}
              style={{
                maxHeight: 250,
                overflow: "auto",
                width:
                  popperNode.current != null
                    ? popperNode.current.clientWidth
                    : null,
              }}
            >
              {options.children}
            </mui.Paper>
          </mui.Popper>
        )}
      />
    </div>
  );
};
