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
    var readOnly = this.props.readOnly || false;
    this.editor = CodeMirror.fromTextArea(this.refs.editor.getDOMNode(), {
      mode: 'text/x-yaml',
      readOnly: readOnly
    });
    this.editor.on('change', this.handleChange);
  },

  componentDidUpdate(prevProps) {
    var readOnly = this.props.readOnly || false;
    if (this.editor.getOption("readOnly") !== readOnly) {
      this.editor.setOption("readOnly", readOnly);
    }
    if (prevProps.hidden && !this.props.hidden) {
      this.editor.refresh();
    }
  },

  render() {
    var {value, className, hidden, readOnly, ...props} = this.props;
    var style = hidden ? 'display: none' : null;
    var classSet = {
      "rfb-YAMLEditor": true,
      "rfb-YAMLEditor--hidden": hidden,
      "rfb-YAMLEditor--readOnly": readOnly
    };
    if (className)
      classSet[className] = true;
    return (
      <div className={cx(classSet)}>
        <textarea
          {...props}
          value={value}
          ref="editor"
        />
      </div>
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
