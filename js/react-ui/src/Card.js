/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import {style, css} from 'react-stylesheet';
import CardBase, {stylesheet} from './CardBase';
import Block from './Block';
import {padding, fontSize} from './theme';

function variant(
  {
    shadow,
    headerColor,
    headerBackground,
    contentColor,
    contentBackground,
    border,
    borderRadius,
  },
) {
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
    },
    Footer: {},
  };
}

let base = variant({
  shadow: css.rgba(37, 40, 43, 0.1),
  border: css.rgb(180),
  borderRadius: 2,
  headerBackground: css.rgb(180),
  headerColor: '#fbfbfb',
  contentBackground: 'white',
  contentColor: '#000',
});

let success = variant({
  shadow: css.rgba(37, 40, 43, 0.1),
  border: css.rgb(40, 172, 33),
  borderRadius: 2,
  headerBackground: css.rgb(40, 172, 33),
  headerColor: '#ffffff',
  contentBackground: 'white',
  contentColor: '#000',
});

export class Card extends CardBase {
  static stylesheet = {
    ...stylesheet,

    Root: style(stylesheet.Root, {
      base: {
        position: css.position.relative,
        ...base.Root,
      },
      success: success.Root,
    }),

    Header: style(stylesheet.Header, {
      base: {
        padding: padding['x-small'],
        fontSize: fontSize['small'],
        fontWeight: 'bold',
        ...base.Header,
      },
      success: success.Header,
    }),

    Content: style(stylesheet.Content, {
      base: {
        verticalAlign: 'top',
        backgroundClip: 'padding-box',
        ...base.Content,
      },
      success: success.Content,
    }),

    Footer: style(stylesheet.Footer, {
      base: {
        padding: padding['xx-small'],
        ...base.Footer,
      },
      success: success.Footer,
    }),
  };
}

export let CardItem = style(Block, {
  base: {
    borderBottom: css.border(1, css.rgb(180)),
    lastChild: {
      borderBottom: css.none,
    },
  },
});

export default Card;
