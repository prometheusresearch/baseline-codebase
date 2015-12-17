/**
 * @copyright 2015, Prometheus Research, LLC
 */

import TabListBase from './base/TabListBase';
import * as CSS from 'react-stylesheet/css';

let color = '#444444';
let linkColor = '#428bca';
let border = CSS.border(1, '#dddddd');
let hoverBackgroundColor = '#eeeeee';
let buttonMargin = 3;


export default TabListBase.style({
  Button: {
    padding: 10,
    color: color,
    hover: {
      textDecoration: CSS.none,
      color: color,
    },
    focus: {
      textDecoration: CSS.none,
      color: color,
    },
    positionTop: {
      marginRight: buttonMargin,
    },
    positionBottom: {
      marginRight: buttonMargin,
    },
    positionLeft: {
      textAlign: CSS.textAlign.right,
      marginBottom: buttonMargin,
    },
    positionRight: {
      marginBottom: buttonMargin,
    },
    selected: {
      backgroundColor: linkColor,
      color: '#ffffff',
      hover: {
        color: '#ffffff',
      }
    },
    notSelected: {
      color: linkColor,
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

