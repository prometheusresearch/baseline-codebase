/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {assert, createRenderer, stub, spy} from 'rex-widget/testutils';

import * as d from 'rex-widget/data';
import {DangerButton} from 'rex-widget/ui';
import Drop from '../Drop';

describe('rex-action/actions', function() {

  describe('<Drop />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
      stub(global, 'setInterval');
      stub(global, 'clearInterval');
      stub(d, 'forceRefreshData');
    });

    afterEach(function() {
      global.setInterval.restore();
      global.clearInterval.restore();
      d.forceRefreshData.restore();
    });

    it('renders', function() {
      let promise = {
        then: spy()
      };
      let data = {
        delete: stub().returns(promise)
      };
      let onEntityUpdate = spy();
      renderer.render(
        <Drop
          data={data}
          context={{individual: {id: 'id'}}}
          entity={{name: 'individual', type: {name: 'individual'}}}
          onEntityUpdate={onEntityUpdate}
          />
      );
      renderer.assertElementWithTypeProps(DangerButton, {disabled: true});
      renderer.instance.componentDidMount();
      assert(setInterval.calledOnce);
      let countdown = setInterval.lastCall.args[0];
      countdown();
      renderer.assertElementWithTypeProps(DangerButton, {disabled: true});
      countdown();
      renderer.assertElementWithTypeProps(DangerButton, {disabled: true});
      countdown();
      renderer.assertElementWithTypeProps(DangerButton, {disabled: false});
      assert(clearInterval.calledOnce);
      let button = renderer.findWithTypeProps(DangerButton);
      button.props.onClick();
      assert(data.delete.calledOnce);
      assert.deepEqual(data.delete.lastCall.args, [{individual: {id: 'id'}}]);
      let then = promise.then.lastCall.args[0];
      then();
      assert(onEntityUpdate.calledOnce);
      assert.deepEqual(onEntityUpdate.lastCall.args, [{id: 'id'}, null]);
      renderer.instance.componentWillUnmount();
      assert(clearInterval.calledTwice);
    });
  });
});

