// @flow
require('../vendor/Animate.js');
module.exports = require('../vendor/Scroller.js');

export type Scroller = {
  doTouchStart(touches: TouchList, timestamp: number): void,
  doTouchMove(touches: TouchList, timestamp: number, scale: number): void,
  doTouchEnd(timestamp: number): void,

  setDimensions(
    width: number,
    width: number,
    contentWidth: number,
    contentHeight: number
  ): void
};

