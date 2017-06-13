/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {assert, createRenderer, spy, findWithTypeProps} from 'rex-widget/testutils';

import {ConfigurableEntityForm as Form} from 'rex-widget/form';
import {Edit} from '../Edit';
import {Action, Entity} from '../../../';

describe('rex-action/actions', function() {
  describe('Edit', function() {
    let renderer;
    let dataMutation;
    let onEntityUpdate;

    beforeEach(function() {
      dataMutation = {params: spy()};
      onEntityUpdate = spy();
      renderer = createRenderer();
      renderer.render(
        <Edit
          entity={{type: {name: 'individual'}}}
          value={{individual: '$individual', a: 42, x: {y: '$individual'}}}
          context={{individual: Entity.createEntity('individual', 1)}}
          contextTypes={{input: {rows: {}}, output: {rows: {}}}}
          fetched={{entity: {data: {}}}}
          dataMutation={dataMutation}
          onEntityUpdate={onEntityUpdate}
        />,
      );
    });

    it('renders', function() {
      let form = renderer.findWithTypeProps(Form);
      assert.deepEqual(form.props.value, {individual: 1, a: 42, x: {y: 1}});
      assert(form.ref);
      let formStub = {
        submit: spy(),
      };
      form.ref(formStub);

      let action = renderer.findWithTypeProps(Action);
      assert(action.props.renderFooter);
      let footer = action.props.renderFooter();
      let button = findWithTypeProps(footer, ReactUI.SuccessButton);
      assert(button.props.onClick);
      let event = {
        preventDefault: spy(),
        stopPropagation: spy(),
      };
      button.props.onClick(event);
      assert(event.preventDefault.calledOnce);
      assert(event.stopPropagation.calledOnce);
      assert(formStub.submit.calledOnce);

      assert(form.props.onSubmitComplete);
      form.props.onSubmitComplete(1, 2);
      assert(onEntityUpdate.calledOnce);
    });
  });
});
