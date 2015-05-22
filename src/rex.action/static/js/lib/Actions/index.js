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
    return element.type.getDefaultProps().title;
  }
}

function getIcon(element) {
  if (element.type.getIcon) {
    return element.type.getIcon(element.props);
  } else if (element.props.icon) {
    return element.props.icon;
  } else {
    return element.type.getDefaultProps().icon;
  }
}

function getWidth(element) {
  if (element.type.getWidth) {
    return element.type.getWidth(element.props);
  } else if (element.props.width) {
    return element.props.width;
  } else {
    return element.type.getDefaultProps().width;
  }
}

module.exports = {
  Make, Pick, View, Page,
  getTitle, getIcon, getWidth
};
