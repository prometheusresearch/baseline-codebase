/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {assert, createRenderer, spy, findWithTypeProps} from 'rex-widget/testutils';

import {ConfigurableForm} from 'rex-widget/form';
import {Form} from '../Form';
import Action from '../../Action';

describe('rex-action/actions', function() {
  describe('Form', function() {
    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      let dataMutation = {params: spy()};
      let refetch = spy();
      let onContext = spy();
      renderer.render(
        <Form
          entity={{name: 'individial', type: {name: 'individial'}}}
          contextTypes={{input: {rows: {}}, output: {rows: {}}}}
          fetched={{entity: {data: {}}}}
          dataMutation={dataMutation}
          refetch={refetch}
          onContext={onContext}
        />,
      );
      renderer.assertElementWithTypeProps(Action);
      let formInstanceStub = {
        submit: spy(),
      };
      let form = renderer.findWithTypeProps(ConfigurableForm);
      form.ref(formInstanceStub);
      let footer = renderer.instance.renderFooter();
      let button = findWithTypeProps(footer, ReactUI.SuccessButton);
      assert(button.props.onClick);
      let eventStub = {
        preventDefault: spy(),
        stopPropagation: spy(),
      };
      button.props.onClick(eventStub);
      assert(formInstanceStub.submit.calledOnce);
      assert(form.props.onSubmitComplete);
      form.props.onSubmitComplete({individial: [{a: 42}]});
      assert(refetch.calledOnce);
      assert(onContext.calledOnce);
      assert.deepEqual(onContext.lastCall.args, [{individial: {a: 42}}]);
    });
  });
});
