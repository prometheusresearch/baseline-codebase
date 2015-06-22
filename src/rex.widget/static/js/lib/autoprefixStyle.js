/**
 * @copyright 2015, Pete Hunt <floydophone@gmail.com>
 * @copyright 2015, Prometheus Research LLC
 */
'use strict';

var DIV = document.createElement('div');

var flexboxNative = 'flex' in DIV.style;
var flexboxWebkit = !flexboxNative && 'WebkitFlex' in DIV.style;

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
    style.WebkitBoxShadow = style.boxShadow;
    style.MozBoxShadow = style.boxShadow;
    style.msBoxSelect = style.boxShadow;
  }

  if (style.hasOwnProperty('fontSmoothing')) {
    style.WebkitFontSmoothing = style.fontSmoothing;
    style.MozOsxFontSmoothing = style.fontSmoothing === 'antialiased' ? 'grayscale' : undefined;
  }
  
  if (style.hasOwnProperty('flex') && flexboxWebkit) {
    style.WebkitFlex = style.flex;
  }

  if (style.hasOwnProperty('flexDirection') && flexboxWebkit) {
    style.WebkitFlexDirection = style.flexDirection;
  }

  if (style.hasOwnProperty('flexWrap') && flexboxWebkit) {
    style.WebkitFlexWrap = style.flexWrap;
  }

  if (style.hasOwnProperty('alignItems') && flexboxWebkit) {
    style.WebkitAlignItems = style.alignItems;
  }

  if (style.hasOwnProperty('flexGrow') && flexboxWebkit) {
    style.WebkitFlexGrow = style.flexGrow;
  }

  if (style.hasOwnProperty('flexShrink') && flexboxWebkit) {
    style.WebkitFlexShrink = style.flexShrink;
  }

  if (style.hasOwnProperty('order') && flexboxWebkit) {
    style.WebkitOrder = style.order;
  }

  if (style.hasOwnProperty('justifyContent') && flexboxWebkit) {
    style.WebkitJustifyContent = style.justifyContent;
  }

  if (style.display === 'flex' && flexboxWebkit) {
    style.display = style.display + ';display:-webkit-flex;';
  }

  return style;
}

module.exports = autoprefixStyle;
