/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var {HBox, VBox}        = require('../Layout');
var Focusable           = require('../Focusable');
var {Input: BaseInput}  = require('react-forms');

var InputStyle = {
  self: {
    display: 'block',
    width: '100%',
    height: '34px',
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

var Input = React.createClass({

  render() {
    var {style, focus, ...props} = this.props;
    style = {...InputStyle.self, ...style};
    return (
      <BaseInput
        {...props}
        ref="input"
        style={style}
        />
    );
  },

  getDefaultProps() {
    return {type: "text"};
  }
});

Input = Focusable(Input);

module.exports = Input;
