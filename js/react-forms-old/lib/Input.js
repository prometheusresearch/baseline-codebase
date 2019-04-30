/**
 * @flow
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React           = require('react');
var PropTypes       = require('prop-types');
var ReactCreateClass = require('create-react-class');
var ReactDOM        = require('react-dom');
var FormPropTypes   = require('./PropTypes');

var Input = ReactCreateClass({

  propTypes: {
    value: FormPropTypes.Value.isRequired,
    input: PropTypes.any,
    markDirty: PropTypes.bool
  },

  render(): ?ReactElement {
    var {input: Component, value, dirtyOnBlur, ...props} = this.props;
    props = {
      ...props,
      ref: 'input',
      value: value.serialized,
      name: value.node.props.get('name') || value.keyPath.join('__'),
      onChange: this.onChange,
      onBlur: dirtyOnBlur && this.onBlur,
      dirtyOnBlur: undefined,
      dirtyOnChange: undefined
    };
    Component = Component || value.node.props.get('input');
    if (Component) {
      return React.isValidElement(Component) ?
        React.cloneElement(Component, props) :
        <Component {...props} />;
    } else {
      return <input {...props} type="text" />;
    }
  },

  getDefaultProps() {
    return {
      dirtyOnBlur: true,
      dirtyOnChange: true
    };
  },

  focus() {
    var input = this.refs.input;
    if (input.focus) {
      input.focus();
    } else {
      let node = ReactDOM.findDOMNode(input)
      if (node != null) {
        node.focus();
      }
    }
  },

  onChange(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    var serialized = getValueFromEvent(e);
    this.props.value.setSerialized(
      serialized, {dirty: this.props.dirtyOnChange});
  },

  onBlur() {
    var {value} = this.props;
    if (!value.isDirty) {
      value.makeDirty();
    }
  }

});

/**
 * Extract value from event
 *
 * We support both React.DOM 'change' events and custom change events
 * emitted from custom components.
 *
 * @param {Event} e
 * @returns {Any}
 */
function getValueFromEvent(e: {target: {value: any}} | any) {
  return e && e.target && e.target.value !== undefined ?
    e.target.value : e;
}

module.exports = Input;
