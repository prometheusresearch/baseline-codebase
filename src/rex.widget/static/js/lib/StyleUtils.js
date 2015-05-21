/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var isString = require('./isString');

var StyleUtils = {

  boxShadow(offsetX, offsetY, blurRadius, spreadRadius, color) {
    return `${offsetX}px ${offsetY}px ${blurRadius}px ${spreadRadius}px ${color}`;
  },

  insetBoxShadow(offsetX, offsetY, blurRadius, spreadRadius, color) {
    return `inset ${StyleUtils.boxShadow(offsetX, offsetY, blurRadius, spreadRadius, color)}`;
  },

  rgba(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  },

  border(width, style, color) {
    return `${width}px ${style} ${color}`;
  },

  linearGradient(direction, ...colorStops) {
    colorStops = colorStops
      .map(p => isString(p) ? p : `${p.color} ${p.value}`)
      .join(', ');
    return `linear-gradient(${direction}, ${colorStops})`;
  }
};

module.exports = StyleUtils;
