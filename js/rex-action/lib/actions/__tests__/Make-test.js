/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {assert, createRenderer, findWithTypeProps, spy} from 'rex-widget/testutils';

import Make from '../Make';
import {Action, Entity} from '../../../';
import * as form from 'rex-widget/form';

describe('rex-action/actions', function() {
  describe('Make', function() {
    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      let refetch = spy();
      let onCommand = spy();
      let dataMutation = {params: spy()};
      renderer.render(
        <Make
          entity={{type: {name: 'individual'}}}
          context={{individual: Entity.createEntity('individual', 1)}}
          contextTypes={{input: {rows: {}}, output: {rows: {}}}}
          fetched={{entity: {data: {}}}}
          refetch={refetch}
          onCommand={onCommand}
          dataMutation={dataMutation}
        />,
      );

      let formStub = {
        submit: spy(),
      };
      let f = renderer.findWithTypeProps(form.ConfigurableEntityForm);
      assert(f.ref);
      f.ref(formStub);

      let action = renderer.findWithTypeProps(Action);
      assert(action.props.renderFooter);
      let footer = action.props.renderFooter();
      let button = findWithTypeProps(footer, ReactUI.SuccessButton);
      assert(button.props.onClick);
      let eventStub = {
        preventDefault: spy(),
        stopPropagation: spy(),
      };
      button.props.onClick(eventStub);
      assert(eventStub.preventDefault.calledOnce);
      assert(eventStub.stopPropagation.calledOnce);
      assert(formStub.submit.calledOnce);

      assert(f.props.onSubmitComplete);
      f.props.onSubmitComplete({});
      assert(onCommand.calledOnce);
      assert(refetch.calledOnce);
    });
  });
});
