/**
 * @copyright 2015 Prometheus Research, LLC
 */

import React, {PropTypes}             from 'react';
import {style}                        from 'react-stylesheet';
import Button                         from './Button';

let PaginatorControls = style('div', {
  displayName: 'PaginatorControls',
  base: {
    height: 32,
    textAlign: 'center',
  }
});

export default class Paginator extends React.Component {

  static defaultProps = {
    stylesheet: {
      Controls: PaginatorControls,
    },
  };

  static propTypes = {
    onPrev: PropTypes.func,
    onNext: PropTypes.func,
    onUp: PropTypes.func,
    title: PropTypes.node,
    children: PropTypes.node,
  };

  render() {
    let {onPrev, onNext, onUp, title, children, stylesheet} = this.props;
    return (
      <div>
        <stylesheet.Controls>
          <Button bold onClick={onPrev} size={{width: '15%', height: 32}}>‹</Button>
          <Button bold onClick={onUp} size={{width: '70%'}}>{title}</Button>
          <Button bold onClick={onNext} size={{width: '15%', height: 32}}>›</Button>
        </stylesheet.Controls>
        <div>
          {children}
        </div>
      </div>
    );
  }
}
