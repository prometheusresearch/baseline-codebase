/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from "react";
import PropTypes from "prop-types";
import * as ReactDOM from "react-dom";
import JSCreole from "jscreole";

import * as FormContext from "./FormContext";

let parser = new JSCreole();

function isString(props, propName, componentName) {
  if (
    typeof props[propName] !== "string" &&
    !(props[propName] instanceof String)
  ) {
    return new Error(
      `Invalid prop '${propName}' supplied to '${componentName}'. Not a string.`,
    );
  }
}

export default class MarkupString extends React.Component {
  static propTypes = {
    children: isString,
    Component: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    inline: PropTypes.bool,
    parameters: PropTypes.object,
  };

  static contextTypes = FormContext.contextTypes;

  static defaultProps = {
    Component: "span",
    inline: false,
    parameters: {},
  };

  render() {
    let {
      Component,
      inline: _inline,
      parameters: _parameters,
      children: _children,
      ...props
    } = this.props;
    return <Component {...props} />;
  }

  /*
   * This function implements a rudimentary variable-subsitution Creole macro.
   *
   * It searches for markup that looks like:
   *    <<Parameter name>>
   *  or
   *    <<Parameter name default>>
   *
   * If the specified <name> exists in the dictionary of parameters that the
   * Form was initialized with, and is it not null, it will insert the
   * parameter's value in place of the macro.
   *
   * If the <name> does not exist (or is null), but a <default> is specified,
   * the <default> value is inserted in the macro's place.
   *
   * If the <name> does not exist (or is null), and no <default> is specified,
   * then an empty string is inserted in the macro's place.
   */
  substituteVariables(text) {
    let parameters = { ...this.context.parameters, ...this.props.parameters };
    text = text.replace(
      /<<Parameter ([a-z](?:[a-z0-9]|[_-](?![_-]))*[a-z0-9])\s*([^>]+)?>>/g,
      (macro, parameter, defaultValue) => {
        let paramValue = parameters[parameter];

        if (paramValue != null) {
          return paramValue;
        }

        if (defaultValue !== undefined) {
          return defaultValue;
        }

        return "";
      },
    );

    return text;
  }

  update() {
    let node = ReactDOM.findDOMNode(this);
    removeChildren(node);

    let text = this.props.children;
    text = this.substituteVariables(text);
    parser.parse(node, text, { inline: this.props.inline });
  }

  componentDidMount() {
    this.update();
  }

  componentDidUpdate() {
    this.update();
  }
}

function removeChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}
