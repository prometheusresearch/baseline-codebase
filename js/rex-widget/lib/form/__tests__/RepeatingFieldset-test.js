/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {spy, createRenderer, assert} from '../../../testutils';

import {createValue} from 'react-forms';
import {RepeatingFieldset, RepeatingFieldsetItemToolbar} from '../RepeatingFieldset';
import Field from '../Field';

describe('rex-widget/form', function() {
  describe('<RepeatingFieldset />', function() {
    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      let formValue = createValue({value: [{a: 1}, {a: 2}]});
      renderer.render(
        <RepeatingFieldset formValue={formValue}>
          <Field select="a" />
        </RepeatingFieldset>,
      );
      let fields = renderer.findAllWithElement(<Field />);
      assert(fields.length === 2);
      renderer.assertElement(<ReactUI.Button />);
    });

    it('adds a new item (default value via props)', function() {
      let onChange = spy();
      let formValue = createValue({
        value: [{a: 1}, {a: 2}],
        onChange,
      });
      renderer.render(
        <RepeatingFieldset formValue={formValue} defaultValue={{a: 42}}>
          <Field select="a" />
        </RepeatingFieldset>,
      );
      let addButton = renderer.findWithElement(<ReactUI.Button />);
      assert(addButton.props.onClick);
      addButton.props.onClick();
      assert(onChange.calledOnce);
      let value = onChange.firstCall.args[0];
      assert(value.value.length === 3);
      assert.deepEqual(value.value, [{a: 1}, {a: 2}, {a: 42}]);
    });

    it('adds a new item (default value via schema)', function() {
      let schema = {type: 'array', defaultItem: {a: 42}};
      let onChange = spy();
      let formValue = createValue({
        value: [{a: 1}, {a: 2}],
        schema,
        onChange,
      });
      renderer.render(
        <RepeatingFieldset formValue={formValue}>
          <Field select="a" />
        </RepeatingFieldset>,
      );
      let addButton = renderer.findWithElement(<ReactUI.Button />);
      assert(addButton.props.onClick);
      addButton.props.onClick();
      assert(onChange.calledOnce);
      let value = onChange.firstCall.args[0];
      assert(value.value.length === 3);
      assert.deepEqual(value.value, [{a: 1}, {a: 2}, {a: 42}]);
    });

    it('adds a new item (no default value)', function() {
      let onChange = spy();
      let formValue = createValue({
        value: [{a: 1}, {a: 2}],
        onChange,
      });
      renderer.render(
        <RepeatingFieldset formValue={formValue}>
          <Field select="a" />
        </RepeatingFieldset>,
      );
      let addButton = renderer.findWithElement(<ReactUI.Button />);
      assert(addButton.props.onClick);
      addButton.props.onClick();
      assert(onChange.calledOnce);
      let value = onChange.firstCall.args[0];
      assert(value.value.length === 3);
      assert.deepEqual(value.value, [{a: 1}, {a: 2}, {}]);
    });

    it('removes an item', function() {
      let onChange = spy();
      let formValue = createValue({
        value: [{a: 1}, {a: 2}],
        onChange,
      });
      renderer.render(
        <RepeatingFieldset formValue={formValue}>
          <Field select="a" />
        </RepeatingFieldset>,
      );

      let closeButtons = renderer.findAllWithType(RepeatingFieldsetItemToolbar);
      assert(closeButtons.length === 2);

      closeButtons[1].props.onRemove();
      assert(onChange.callCount === 1);
      assert(onChange.firstCall.args[0].value.length === 1);
      assert.deepEqual(onChange.firstCall.args[0].value, [{a: 1}]);
    });
  });
});
