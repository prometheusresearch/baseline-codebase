/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

export default function TransitionGroup(
  {name, style, ...props}: {name: string, style: Object},
) {
  let transitionName = {
    enter: style[name + 'Enter'],
    enterActive: style[name + 'EnterActive'],
    leave: style[name + 'Leave'],
    leaveActive: style[name + 'LeaveActive'],
  };
  return <ReactCSSTransitionGroup {...props} transitionName={transitionName} />;
}
