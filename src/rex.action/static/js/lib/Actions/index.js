/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Page = require('./Page');
var Pick = require('./Pick');
var View = require('./View');
var Make = require('./Make');

function getTitle(element) {
  if (element.type.getTitle) {
    return element.type.getTitle(element.props);
  } else if (element.props.title) {
    return element.props.title;
  } else {
    return '';
  }
}

module.exports = {
  Make, Pick, View, Page,
  getTitle
};
