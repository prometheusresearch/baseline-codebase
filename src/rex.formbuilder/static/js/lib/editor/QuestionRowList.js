/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var RepeatingFieldset = require('../RepeatingFieldset');

var QuestionRowList = React.createClass({

  render() {
    var {className, ...props} = this.props;
    return (
      <RepeatingFieldset
        {...props}
        className={cx("rfb-QuestionRowList", className)}
        buttonCaption="Add new row"
        />
    );
  }
});

module.exports = QuestionRowList;
