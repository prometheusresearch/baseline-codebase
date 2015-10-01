/**
 * @copyright 2015, Pete Hunt <floydophone@gmail.com>
 * @copyright 2015, Prometheus Research LLC
 */
'use strict';

let ELEMENT = document.createElement('div');

let flexNative = 'flex' in ELEMENT.style;
let flexWebkit = !flexNative && 'WebkitFlex' in ELEMENT.style;

let boxShadowNative = 'boxShadow' in ELEMENT.style;
let boxShadowWebkit = !boxShadowNative && 'WebkitBoxShadow' in ELEMENT.style;
let boxShadowMoz = !boxShadowNative && 'MozBoxShadow' in ELEMENT.style;

function autoprefixStyle(style) {
  if (style.hasOwnProperty('userSelect')) {
    style.WebkitUserSelect = style.userSelect;
    style.MozUserSelect = style.userSelect;
    style.msUserSelect = style.userSelect;
  }

  if (style.hasOwnProperty('transition')) {
    style.WebkitTransition = style.transition;
    style.MozTransition = style.transition;
    style.msTransition = style.transition;
  }

  if (style.hasOwnProperty('boxShadow')) {
    if (boxShadowWebkit) {
      style.WebkitBoxShadow = style.boxShadow;
    } else if (boxShadowMoz) {
      style.MozBoxShadow = style.boxShadow;
    }
  }

  if (style.hasOwnProperty('fontSmoothing')) {
    style.WebkitFontSmoothing = style.fontSmoothing;
    style.MozOsxFontSmoothing = style.fontSmoothing === 'antialiased' ? 'grayscale' : undefined;
  }
  
  if (style.hasOwnProperty('flex') && flexWebkit) {
    style.WebkitFlex = style.flex;
  }

  if (style.hasOwnProperty('flexDirection') && flexWebkit) {
    style.WebkitFlexDirection = style.flexDirection;
  }

  if (style.hasOwnProperty('flexWrap') && flexWebkit) {
    style.WebkitFlexWrap = style.flexWrap;
  }

  if (style.hasOwnProperty('alignItems') && flexWebkit) {
    style.WebkitAlignItems = style.alignItems;
  }

  if (style.hasOwnProperty('flexGrow') && flexWebkit) {
    style.WebkitFlexGrow = style.flexGrow;
  }

  if (style.hasOwnProperty('flexShrink') && flexWebkit) {
    style.WebkitFlexShrink = style.flexShrink;
  }

  if (style.hasOwnProperty('order') && flexWebkit) {
    style.WebkitOrder = style.order;
  }

  if (style.hasOwnProperty('justifyContent') && flexWebkit) {
    style.WebkitJustifyContent = style.justifyContent;
  }

  if (style.display === 'flex' && flexWebkit) {
    style.display = style.display + ';display:-webkit-flex;';
  }

  return style;
}

module.exports = autoprefixStyle;
