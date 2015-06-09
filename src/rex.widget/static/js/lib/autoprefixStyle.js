/**
 * @copyright 2015, Pete Hunt <floydophone@gmail.com>
 * @copyright 2015, Pete Hunt <floydophone@gmail.com>
 */
'use strict';

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
  
  if (style.hasOwnProperty('flex')) {
    style.WebkitFlex = style.flex;
  }

  if (style.hasOwnProperty('flexDirection')) {
    style.WebkitFlexDirection = style.flexDirection;
  }

  if (style.hasOwnProperty('flexWrap')) {
    style.WebkitFlexWrap = style.flexWrap;
  }

  if (style.hasOwnProperty('alignItems')) {
    style.WebkitAlignItems = style.alignItems;
  }

  if (style.hasOwnProperty('flexGrow')) {
    style.WebkitFlexGrow = style.flexGrow;
  }

  if (style.hasOwnProperty('flexShrink')) {
    style.WebkitFlexShrink = style.flexShrink;
  }

  if (style.hasOwnProperty('order')) {
    style.WebkitOrder = style.order;
  }

  if (style.hasOwnProperty('justifyContent')) {
    style.WebkitJustifyContent = style.justifyContent;
  }

  if (style.display === 'flex') {
    style.display = style.display + ';display:-webkit-flex;display:-ms-flexbox';
  }

  return style;
}

module.exports = autoprefixStyle;
