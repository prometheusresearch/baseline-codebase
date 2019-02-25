/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {style} from 'react-stylesheet';

let ButtonRoot = style('div', {
  displayName: 'ButtonRoot',
  base: {
    borderRadius: 2,
    padding: 4,
    display: 'inline-block',
    textDecoration: 'none',
    cursor: 'pointer',
    textAlign: 'center',
    color: '#666',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    border: '1px solid transparent',

    hover: {
      color: '#262626',
      backgroundColor: '#f5f5f5',
    },

    active: {
      color: '#262626',
      backgroundColor: '#dddddd !important',
    },

    focus: {
      outline: 'none',
      border: '1px solid #B7B7B7',
    }
  },
  active: {
    color: '#262626',
    backgroundColor: '#dddddd !important',
  },
  dimmed: {
    color: '#bbbbbb',
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default class Button extends React.Component {

  static propTypes = {
    active: PropTypes.bool,
    bold: PropTypes.bool,
    dimmed: PropTypes.bool,
    size: PropTypes.object,
    color: PropTypes.string,
    backgroundColor: PropTypes.string,
  };

  static defaultProps = {
    size: {},
    stylesheet: {Root: ButtonRoot},
  };

  render() {
    let {
      active, bold, size: {width, height}, dimmed,
      color, backgroundColor,
      stylesheet,
      ...props
    } = this.props;
    return (
      <stylesheet.Root
        {...props}
        variant={{bold, dimmed, active}}
        style={{width, height, color, backgroundColor}}
        role="button"
        />
    );
  }
}
