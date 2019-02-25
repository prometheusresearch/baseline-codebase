/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {assert, spy} from 'rex-widget/testutils';
import cloneElementWithRef from '../cloneElementWithRef';

describe('rex-action', function() {

  describe('cloneElementWithRef', function() {

    function Component() {
    }

    it('clones element with ref', function() {
      let origRef = spy();
      let ref = spy();
      let clone = cloneElementWithRef(<Component ref={origRef} />, {ok: true, ref});
      assert(clone.props.ok);
      assert(clone.ref);
      clone.ref(1);
      assert(origRef.calledOnce);
      assert(ref.calledOnce);
    });

    it('clones element without ref', function() {
      let ref = spy();
      let clone = cloneElementWithRef(<Component />, {ok: true, ref});
      assert(clone.props.ok);
      assert(clone.ref);
      clone.ref(1);
      assert(ref.calledOnce);
    });

  });

});
