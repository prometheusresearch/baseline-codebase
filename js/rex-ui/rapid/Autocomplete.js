/**
 * @flow
 */

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { type Endpoint } from "rex-graphql";
import * as Resource from "rex-graphql/Resource";
import * as mui from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import Autosuggest from "react-autosuggest";
import deburr from "lodash/deburr";
import match from "autosuggest-highlight/match";
import parse from "autosuggest-highlight/parse";

import { buildQuery } from "./buildQuery";
import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import * as QueryPath from "./QueryPath.js";
import * as Field from "./Field.js";

export type AutocompleteProps = {|
  endpoint: Endpoint,
  fetch: string,
  labelField: Field.FieldConfig,
  label?: string,
  fields?: Field.FieldConfig[],
  placeholder?: string,
  value: ?Object,
  onValue: (?Object) => void,
  RenderItem?: React.AbstractComponent<{| label: React.Node, item: Object |}>,
|};

export function Autocomplete(props: AutocompleteProps) {
  let {
    fetch,
    endpoint,
    labelField,
    fields = [],
    value,
    onValue,
    label,
    placeholder,
    RenderItem,
  } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let { resource, path } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let fieldSpecs = Field.configureFields(["id", labelField, ...fields]);
    let { query, ast, fields: nextFieldSpecs } = buildQuery({
      schema,
      path,
      fields: fieldSpecs,
    });
    let resource = Resource.defineQuery<void, any>({ endpoint, query });
    return { path, resource, fieldSpecs: nextFieldSpecs };
  }, [fetch, endpoint, schema, labelField, fields]);

  return (
    <AutocompleteRenderer
      path={path}
      resource={resource}
      labelField={labelField}
      label={label}
      placeholder={placeholder}
      value={value}
      onValue={onValue}
      RenderItem={RenderItem}
    />
  );
}

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
    marginTop: theme.spacing.unit,
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
    height: theme.spacing.unit * 2,
  },
}));

type AutocompleteRendererProps = {|
  path: QueryPath.QueryPath,
  resource: Resource.Resource<any, any>,
  labelField: Field.FieldConfig,
  label?: string,
  placeholder?: string,
  value: ?string,
  onValue: (?string) => void,
  RenderItem?: React.AbstractComponent<{| label: React.Node, item: Object |}>,
|};

function AutocompleteRenderer(props: AutocompleteRendererProps) {
  let {
    resource,
    path,
    label,
    placeholder,
    labelField,
    value,
    onValue,
    RenderItem,
  } = props;

  let popperNode = React.useRef<?HTMLElement>(null);
  let [search, setSearch] = React.useState(
    value != null ? value[(labelField: any)] : "",
  );
  let [suggestions, setSuggestions] = React.useState([]);

  let onSuggestionsFetchRequested = ({ value }) => {
    Resource.fetch(resource, { search: value }).then(data => {
      for (let key of QueryPath.toArray(path)) {
        if (data == null) {
          break;
        }
        data = data[key];
      }
      setSuggestions(data);
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
    let label = suggestion[labelField];
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
    return suggestion[labelField];
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
}
