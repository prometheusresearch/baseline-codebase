/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {assert, createRenderer, stub, spy} from 'rex-widget/testutils';

import Drop from '../Drop';

describe('rex-action/actions', function() {
  describe('<Drop />', function() {
    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
      stub(global, 'setInterval').returns(1);
      stub(global, 'clearInterval');
    });

    afterEach(function() {
      global.setInterval.restore();
      global.clearInterval.restore();
    });

    it('renders', function() {
      let promise = {
        then: spy(),
      };
      let data = {
        delete: stub().returns(promise),
      };
      let onEntityUpdate = spy();
      renderer.render(
        <Drop
          data={data}
          context={{individual: {id: 'id'}}}
          entity={{name: 'individual', type: {name: 'individual'}}}
          onEntityUpdate={onEntityUpdate}
        />,
      );
      renderer.assertElementWithTypeProps(ReactUI.DangerButton, {disabled: true});
      renderer.instance.componentDidMount();
      assert(setInterval.calledOnce);
      let countdown = setInterval.lastCall.args[0];
      countdown();
      renderer.assertElementWithTypeProps(ReactUI.DangerButton, {disabled: true});
      countdown();
      renderer.assertElementWithTypeProps(ReactUI.DangerButton, {disabled: true});
      countdown();
      renderer.assertElementWithTypeProps(ReactUI.DangerButton, {disabled: false});
      assert(clearInterval.calledOnce);
      let button = renderer.findWithTypeProps(ReactUI.DangerButton);
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
