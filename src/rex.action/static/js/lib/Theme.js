/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var RexWidget                   = require('rex-widget');
var {overflow, boxShadow, rgb}  = RexWidget.StyleUtils;

var color = {
  shadowLight: rgb(204, 204, 204)
};

var shadow = {
  light: boxShadow(0, 0, 1, 0, color.shadowLight)
};

module.exports = {color, shadow};
