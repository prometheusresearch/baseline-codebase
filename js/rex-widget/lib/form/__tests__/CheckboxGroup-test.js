/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {createRenderer, assert, spy} from '../../../testutils';
import Checkbox from '../Checkbox';
import CheckboxGroup from '../CheckboxGroup';

describe('rex-widget/form', function() {

  let options = [
    {id: 'a', title: 'A'},
    {id: 'b', title: 'B'}
  ];

  let renderer = null;

  beforeEach(function() {
    renderer = createRenderer();
  });

  describe('<CheckboxGroup />', function() {

    it('renders', function() {
      let onChange = spy();
      renderer.render(
        <CheckboxGroup
          value={['a']}
          onChange={onChange}
          options={options}
          />
      );
      let checkboxes = renderer.findAllWithType(Checkbox);

      assert(checkboxes.length === 2);
      assert(checkboxes[0].props.value);
      assert(!checkboxes[1].props.value);

      checkboxes[0].props.onChange(false);
      assert(onChange.callCount === 1);
      assert.deepEqual(onChange.lastCall.args[0], []);

      checkboxes[1].props.onChange(true);
      assert(onChange.callCount === 2);
      assert.deepEqual(onChange.lastCall.args[0], ['a', 'b']);
    });
  });

});
