/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import CardBase from './CardBase';
import {style, css} from './stylesheet';
import Block from './Block';
import {padding, fontSize} from './theme';

function mixinVariants(stylesheet, variants) {
  let nextStylesheet = {...stylesheet};
  for (let variantName in variants) {
    let variantStylesheet = variants[variantName];
    for (let name in variantStylesheet) {
      if (variantName === 'default') {
        nextStylesheet[name] = {
          ...nextStylesheet[name],
          ...variantStylesheet[name],
        };
      } else {
        nextStylesheet[name] = {
          ...nextStylesheet[name],
          [variantName]: variantStylesheet[name],
        };
      }
    }
  }
  return nextStylesheet;
}

function variant({
  shadow,
  headerColor,
  headerBackground,
  contentColor,
  contentBackground,
  border,
  borderRadius,
}) {
  return {
    Root: {
      boxShadow: css.boxShadow(0, 1, 2, 0, shadow),
      border: css.border(1, border),
      borderRadius: borderRadius,
    },
    Header: {
      backgroundColor: headerBackground,
      color: headerColor,
    },
    Content: {
      backgroundColor: contentBackground,
      color: contentColor,
    }
  };
}

export default style(CardBase, mixinVariants({
  Root: {
    position: css.position.relative,
  },
  Header: {
    padding: padding['x-small'],
    fontSize: fontSize['small'],
    fontWeight: 'bold',
  },
  Content: {
    verticalAlign: 'top',
    backgroundClip: 'padding-box',
  },
  Footer: {
    padding: padding['xx-small'],
  }
}, {
  default: variant({
    shadow: css.rgba(37, 40, 43, 0.1),
    border: css.rgb(180),
    borderRadius: 2,
    headerBackground: css.rgb(180),
    headerColor: '#fbfbfb',
    contentBackground: 'white',
    contentColor: '#000',
  }),
  success: variant({
    shadow: css.rgba(37, 40, 43, 0.1),
    border: css.rgb(40, 172, 33),
    borderRadius: 2,
    headerBackground: css.rgb(40, 172, 33),
    headerColor: '#ffffff',
    contentBackground: 'white',
    contentColor: '#000',
  }),
}));

export let CardItem = style(Block, {
  borderBottom: css.border(1, css.rgb(180)),
  lastChild: {
    borderBottom: css.none,
  }
});
