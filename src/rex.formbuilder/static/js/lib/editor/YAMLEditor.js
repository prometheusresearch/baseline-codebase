/**
 * @jsx React.DOM
 */
'use strict';

var React      = require('react/addons');
var cx         = React.addons.classSet;
var CodeMirror = require('codemirror/lib/codemirror.js');
var YAMLCodeMirror = require('codemirror/mode/yaml/yaml.js');

var YAMLEditor = React.createClass({

  componentDidMount() {
    this.editor = CodeMirror.fromTextArea(this.refs.editor.getDOMNode(), {
      mode: 'text/x-yaml'
    });
    this.editor.on('change', this.handleChange);
    console.log('editor', this.editor);
  },

  render() {
    var {value, className, hidden, ...props} = this.props;
    var style = hidden ? 'display: none' : null;
    var classSet = {
      "rfb-YAMLEditor": true,
      "rfb-YAMLEditor--hidden": hidden
    };
    if (className)
      classSet[className] = true;
    return (
      <textarea
        {...props}
        className={cx(classSet)}
        value={value}
        ref="editor"
        />
    );
    /* onChange={this.onChange} */
  },

  getDefaultProps() {
    return {
      value: '',
      onChange: function () {}
    };
  },

  handleChange() {
    var value = this.editor.getValue();
    if (value !== this.props.value) {
      this.props.onChange(value);
    }
  },

  onChange(e) {
    var value = e.target.value;
    if (!value)
      value = undefined;
    this.props.onChange(value);
  }
});

module.exports = YAMLEditor;
