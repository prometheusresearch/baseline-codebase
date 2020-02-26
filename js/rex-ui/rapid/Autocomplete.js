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

import { introspect } from "./Introspection.js";
import * as EndpointSchemaStorage from "./EndpointSchemaStorage.js";
import * as QueryPath from "./QueryPath.js";
import * as Field from "./FieldLegacy.js";

export type AutocompleteProps = {|
  /** GraphQL endpoint. */
  endpoint: Endpoint,
  /** Path inside GraphQL schema. */
  fetch: string,

  /** Field which specifies the label. */
  labelField: Field.FieldConfig,
  /** Field which specifies the id. */
  idField?: Field.FieldConfig,
  /** Additional fields to query. */
  fields?: { [name: string]: Field.FieldConfig },

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

export function Autocomplete(props: AutocompleteProps) {
  let {
    fetch,
    endpoint,
    labelField,
    idField = "id",
    fields = {},
    value,
    onValue,
    label,
    placeholder,
    RenderItem,
  } = props;
  let schema = EndpointSchemaStorage.useIntrospectionSchema(endpoint);

  let { resource, path, fieldSpecs } = React.useMemo(() => {
    let path = QueryPath.make(fetch);
    let { query, fieldSpecs } = introspect({
      schema,
      path,
      fields: { ...fields, id: idField, label: labelField },
    });
    let resource = Resource.defineQuery<void, any>({ endpoint, query });
    return { path, resource, fieldSpecs };
  }, [fetch, endpoint, schema, labelField, fields, idField]);

  return (
    <AutocompleteRenderer
      path={path}
      resource={resource}
      fieldSpecs={fieldSpecs}
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
  fieldSpecs: { id: Field.FieldSpec, label: Field.FieldSpec },
  label?: string,
  placeholder?: string,
  value: ?Object,
  onValue: (?Object) => void,
  RenderItem?: React.AbstractComponent<{| label: React.Node, item: Object |}>,
|};

function AutocompleteRenderer(props: AutocompleteRendererProps) {
  let {
    resource,
    path,
    label,
    placeholder,
    fieldSpecs,
    value,
    onValue,
    RenderItem,
  } = props;

  let popperNode = React.useRef<?HTMLElement>(null);
  let [search, setSearch] = React.useState(
    value != null ? value[fieldSpecs.label.require.field] : "",
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
    let label = suggestion[fieldSpecs.label.require.field];
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
    return suggestion[fieldSpecs.label.require.field];
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
