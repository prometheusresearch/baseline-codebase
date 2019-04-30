/**
 * @copyright 2015, Facebook, Inc. All rights reserved.
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import { isTouchDevice } from "../Environment";
import { type Scroller } from './Scroller';

type Props = {
  scroller?: ?Scroller,
  touchable?: boolean,
  render: DOMProps => React.Node
};

export opaque type DOMProps: {} = {
  onTouchStart?: TouchEvent => void,
  onTouchMove?: TouchEvent => void,
  onTouchEnd?: TouchEvent => void,
  onTouchCancel?: TouchEvent => void
};

let TouchableArea = ({ touchable = true, scroller, render }: Props) => {
  let onTouchStart = React.useCallback(
    (e: TouchEvent) => {
      if (scroller != null && touchable) {
        scroller.doTouchStart(e.touches, e.timeStamp);
      }
    },
    [scroller, touchable]
  );

  let onTouchMove = React.useCallback(
    (e: TouchEvent) => {
      if (scroller != null && touchable) {
        // $FlowFixMe: ...
        let scale = e.scale;
        scroller.doTouchMove(e.touches, e.timeStamp, scale);
        e.preventDefault();
      }
    },
    [scroller, touchable]
  );

  let onTouchEnd = React.useCallback(
    (e: TouchEvent) => {
      if (scroller != null && touchable) {
        scroller.doTouchEnd(e.timeStamp);
      }
    },
    [scroller, touchable]
  );

  if (isTouchDevice) {
    let domProps = {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd
    };
    return render(domProps);
  } else {
    let domProps = {
      onTouchStart: undefined,
      onTouchMove: undefined,
      onTouchEnd: undefined,
      onTouchCancel: undefined
    };
    return render(domProps);
  }
};

export default TouchableArea;
