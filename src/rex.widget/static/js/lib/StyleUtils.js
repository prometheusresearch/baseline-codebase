/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var isString = require('./isString');

function boxShadow(offsetX, offsetY, blurRadius, spreadRadius, color) {
  return `${offsetX}px ${offsetY}px ${blurRadius}px ${spreadRadius}px ${color}`;
}

function insetBoxShadow(offsetX, offsetY, blurRadius, spreadRadius, color) {
  return `inset ${boxShadow(offsetX, offsetY, blurRadius, spreadRadius, color)}`;
}

function rgba(r, g, b, a) {
  if (b === undefined && a === undefined) {
    a = g;
    g = r;
    b = r;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function rgb(r, g, b) {
  if (g === undefined && b === undefined) {
    g = r;
    b = r;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function border(width, style, color) {
  return `${width}px ${style} ${color}`;
}

var borderStyle = {
  solid: 'solid'
};

function linearGradient(direction, ...colorStops) {
  colorStops = colorStops
    .map(p => isString(p) ? p : `${p.color} ${p.value}`)
    .join(', ');
  return `linear-gradient(${direction}, ${colorStops})`;
}

function transform(duration) {
  return `transform ${duration}s`;
}

function translate3d(x, y, z) {
  return `translate3d(${x}px, ${y}px, ${z}px)`;
}

var position = {
  absolute: 'absolute',
  relative: 'relative',
  fixed: 'fixed'
};

var cursor = {
  pointer: 'pointer'
};

var overflow = {
  auto: 'auto',
  hidden: 'hidden',
  scroll: 'scroll'
};

module.exports = {
  overflow, cursor, position, translate3d, transform, linearGradient, borderStyle,
  border, rgb, rgba, insetBoxShadow, boxShadow
};
