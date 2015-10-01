/**
 * @copyright 2015, Prometheus Research, LLC
 */

import keyMirror  from 'keymirror';
import isString   from './isString';

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

let borderStyle = keyMirror({
  solid: true
});

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

function sizeSeq(...args) {
  return args
    .map(arg => isString(arg) ? arg : `${arg}px`)
    .join(' ');
}

let padding = sizeSeq;
let margin = sizeSeq;

let position = keyMirror({
  absolute: true,
  relative: true,
  fixed: true,
});

let display = {
  block: 'block',
  inlineBlock: 'inline-block',
  flex: 'flex',
  inlineFlex: 'inline-flex',
  inline: 'inline',

};

let cursor = keyMirror({
  pointer: true,
});

let overflow = keyMirror({
  auto: true,
  hidden: true,
  scroll: true,
});

let textAlign = keyMirror({
  center: true,
  left: true,
  right: true,
});

let verticalAlign = keyMirror({
  middle: true,
  baseline: true,
  sub: true,
  super: true,
  top: true,
  bottom: true,
});

let fontWeight = keyMirror({
  bold: true,
  normal: true,
});

let touchAction = keyMirror({
  manipulation: true,
});

let none = 'none';

let whiteSpace = keyMirror({
  nowrap: true
});

let textDecoration = keyMirror({
  none: 'none',
  underline: true,
});

let textOverflow = keyMirror({
  ellipsis: true,
});

let color = keyMirror({
  transparent: true,
});

module.exports = {
  border,
  borderStyle,
  overflow,
  cursor,
  color,
  position,
  translate3d,
  transform,
  linearGradient,
  rgb,
  rgba,
  insetBoxShadow,
  boxShadow,
  textAlign,
  fontWeight,
  padding,
  margin,
  display,
  verticalAlign,
  none,
  touchAction,
  whiteSpace,
  textOverflow,
  textDecoration,
};
