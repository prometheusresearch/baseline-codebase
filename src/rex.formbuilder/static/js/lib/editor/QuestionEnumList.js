/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var RepeatingFieldset = require('../RepeatingFieldset');

var QuestionEnumList = React.createClass({

  render() {
    var {className, ...props} = this.props;
    return (
      <RepeatingFieldset
        {...props}
        className={cx("rfb-QuestionEnumList", className)}
        buttonCaption="Add new enumeration"
        />
    );
  }
});

module.exports = QuestionEnumList;
