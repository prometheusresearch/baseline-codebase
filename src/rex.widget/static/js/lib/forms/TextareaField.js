/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React = require('react/addons');
var Field = require('./Field');

var TextareaFieldStyle = {
  input: {
    display: 'block',
    width: '100%',
    padding: '6px 12px',
    fontSize: '14px',
    lineHeight: 1.42857143,
    color: '#555',
    backgroundColor: '#fff',
    backgroundImage: 'none',
    border: '1px solid #ccc',
    borderRadius: '2px',
    boxShadow: 'inset 0 1px 1px rgba(0,0,0,.075)',
    transition: 'border-color ease-in-out .15s,box-shadow ease-in-out .15s'
  }
}

var TextareaField = React.createClass({

  render() {
    return (
      <Field {...this.props}>
        <textarea style={TextareaFieldStyle.input} />
      </Field>
    );
  }
});

module.exports = TextareaField;
