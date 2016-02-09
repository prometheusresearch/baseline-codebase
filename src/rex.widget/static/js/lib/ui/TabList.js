/**
 * @copyright 2015, Prometheus Research, LLC
 */

import TabListBase from './base/TabListBase';
import * as CSS from '../../css';
import {style} from '../../stylesheet';

let color = '#444444';
let border = CSS.border(1, '#dddddd');
let hoverBackgroundColor = '#eeeeee';

export default style(TabListBase, {
  ButtonList: {
    positionTop: {
      borderBottom: border,
    },
    positionRight: {
      borderLeft: border,
    },
    positionBottom: {
      borderTop: border,
    },
    positionLeft: {
      borderRight: border,
    },
  },
  Button: {
    fontWeight: 300,
    fontSize: '90%',
    padding: 10,
    color: color,
    hover: {
      textDecoration: CSS.none,
      color: color,
    },
    focus: {
      textDecoration: CSS.none,
    },
    positionTop: {
      top: 1,
    },
    positionBottom: {
      bottom: 1,
    },
    positionLeft: {
      left: 1,
    },
    positionRight: {
      right: 1,
    },
    selected: {
      fontWeight: 400,
      backgroundColor: '#ffffff',
      positionTop: {
        borderTop: border,
        borderLeft: border,
        borderRight: border,
      },
      positionBottom: {
        borderBottom: border,
        borderLeft: border,
        borderRight: border,
      },
      positionLeft: {
        borderBottom: border,
        borderLeft: border,
        borderTop: border,
      },
      positionRight: {
        borderBottom: border,
        borderRight: border,
        borderTop: border,
      },
    },
    notSelected: {
      color: color,
      cursor: CSS.cursor.pointer,
      hover: {
        backgroundColor: hoverBackgroundColor,
      },
      focus: {
        backgroundColor: hoverBackgroundColor,
      }
    }
  }
});
