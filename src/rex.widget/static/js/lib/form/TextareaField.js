/**
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var TextareaAutosize  = require('react-textarea-autosize');
var FieldBase         = require('./FieldBase');

var TextareaField = React.createClass({

  render() {
    var {autosize, className, ...props} = this.props;
    var input = autosize ?
      <TextareaAutosize className="rw-TextareaField__textarea" /> :
      <textarea className="rw-TextareaField__textarea" />;
    return (
      <FieldBase
        {...props}
        className={cx('rw-TextareaField', className)}
        input={input}
        />
    );
  }
});

module.exports = TextareaField;
