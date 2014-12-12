/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var RepeatingFieldset = require('../RepeatingFieldset');

var NestedQuestionList = React.createClass({

  render() {
    var {className, ...props} = this.props;
    return (
      <RepeatingFieldset
        {...props}
        className={cx("rfb-NestedQuestionList", className)}
        buttonCaption="Add new question"
        />
    );
  }
});

module.exports = NestedQuestionList;
