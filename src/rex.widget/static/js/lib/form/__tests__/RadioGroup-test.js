/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {createRenderer, assert, spy} from '../../../testutils';
import Radio from '../Radio';
import RadioGroup from '../RadioGroup';

describe('rex-widget/form', function() {

  let options = [
    {id: 'a', title: 'A'},
    {id: 'b', title: 'B'}
  ];

  let renderer = null;

  beforeEach(function() {
    renderer = createRenderer();
  });

  describe('<RadioGroup />', function() {

    it('renders', function() {
      let onChange = spy();
      renderer.render(
        <RadioGroup
          value={'a'}
          onChange={onChange}
          options={options}
          />
      );
      let radios = renderer.findAllWithType(Radio);

      assert(radios.length === 2);
      assert(radios[0].props.value);
      assert(!radios[1].props.value);

      radios[1].props.onChange(true);
      assert(onChange.callCount === 1);
      assert.deepEqual(onChange.lastCall.args[0], 'b');
    });
  });

});

