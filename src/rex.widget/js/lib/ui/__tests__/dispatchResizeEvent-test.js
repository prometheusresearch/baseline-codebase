/**
 * @copyright 2016, Prometheus Research, LLC
 */

import Sinon from 'sinon';
import assert from 'power-assert';
import dispatchResizeEvent from '../dispatchResizeEvent';

describe('dispatchResizeEvent', function() {

  it('dispatches resize event on window', function(done) {
    let onResize = Sinon.spy();
    window.addEventListener('resize', onResize);
    dispatchResizeEvent();
    setTimeout(function() {
      assert(onResize.calledOnce);
      window.removeEventListener('resize', onResize);
      done();
    }, 5);
  });
});
