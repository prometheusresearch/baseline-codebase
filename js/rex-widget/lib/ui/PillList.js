/**
 * @copyright 2015, Prometheus Research, LLC
 */

import TabListBase from './base/TabListBase';
import * as css from '../../css';
import {style} from '../../stylesheet';

let color = '#444444';
let linkColor = '#428bca';
let hoverBackgroundColor = '#eeeeee';
let buttonMargin = 3;


export default style(TabListBase, {
  Button: {
    fontWeight: 300,
    fontSize: '90%',
    padding: 10,
    color: color,
    hover: {
      textDecoration: css.none,
      color: color,
    },
    focus: {
      textDecoration: css.none,
      color: color,
    },
    positionTop: {
      marginRight: buttonMargin,
    },
    positionBottom: {
      marginRight: buttonMargin,
    },
    positionLeft: {
      textAlign: css.textAlign.right,
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
      cursor: css.cursor.pointer,
      hover: {
        backgroundColor: hoverBackgroundColor,
      },
      focus: {
        backgroundColor: hoverBackgroundColor,
      }
    }
  }
});

