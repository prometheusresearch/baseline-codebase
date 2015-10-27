/**
 * @jsx React.DOM
 */
'use strict';

var React          = require('react');
var JSCreole       = require('jscreole');
var removeChildren = require('./removeChildren');

var parser = new JSCreole();

var creole = React.createClass({

  propTypes: {
    children: React.PropTypes.string.isRequired,
    component: React.PropTypes.component,
    inline: React.PropTypes.bool,
    parameters: React.PropTypes.object
  },

  render: function() {
    var component = this.props.component;
    return this.transferPropsTo(<component />);
  },

  getDefaultProps: function() {
    return {
      component: React.DOM.span,
      inline: false,
      parameters: {}
    };
  },

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
  substituteVariables: function (text) {
    text = text.replace(
      /<<Parameter ([a-z](?:[a-z0-9]|[_-](?![_-]))*[a-z0-9])\s*([^>]+)?>>/g,
      (macro, parameter, defaultValue) => {
        var paramValue = this.props.parameters[parameter];
        if ((paramValue !== null) && (paramValue !== undefined)) {
          return paramValue;
        }

        if (defaultValue !== undefined) {
          return defaultValue;
        }

        return '';
      }
    );

    return text;
  },

  update: function() {
    var node = this.getDOMNode();
    removeChildren(node);

    var text = this.props.children;
    text = this.substituteVariables(text);
    parser.parse(node, text, {inline: this.props.inline});
  },

  componentDidMount: function() {
    this.update();
  },

  componentDidUpdate: function() {
    this.update();
  },

  shouldComponentUpdate: function(nextProps) {
    var shouldUpdate = (
      this.props.inline !== nextProps.inline
      || this.props.children !== nextProps.children
    );
    return shouldUpdate;
  }
});

module.exports = creole;
