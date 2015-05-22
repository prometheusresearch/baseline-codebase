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
  } else if (element.type.getDefaultProps) {
    return element.type.getDefaultProps().title;
  } else {
    return '';
  }
}

function getIcon(element) {
  if (element.type.getIcon) {
    return element.type.getIcon(element.props);
  } else if (element.props.icon) {
    return element.props.icon;
  } else if (element.type.getDefaultProps) {
    return element.type.getDefaultProps().icon;
  } else {
    return null;
  }
}

function getWidth(element) {
  if (element.type.getWidth) {
    return element.type.getWidth(element.props);
  } else if (element.props.width) {
    return element.props.width;
  } else if (element.type.getDefaultProps) {
    return element.type.getDefaultProps().width;
  } else {
    return 480;
  }
}

module.exports = {
  Make, Pick, View, Page,
  getTitle, getIcon, getWidth
};
