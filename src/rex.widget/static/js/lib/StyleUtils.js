/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var StyleUtils = {

  boxShadow(offsetX, offsetY, blurRadius, spreadRadius, color) {
    return `${offsetX}px ${offsetY}px ${blurRadius}px ${spreadRadius}px ${color}`;
  },

  insetBoxShadow(offsetX, offsetY, blurRadius, spreadRadius, color) {
    return `inset ${StyleUtils.boxShadow(offsetX, offsetY, blurRadius, spreadRadius, color)}`;
  }
};

module.exports = StyleUtils;
