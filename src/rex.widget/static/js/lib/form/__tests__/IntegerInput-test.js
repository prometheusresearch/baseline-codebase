/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer, assert, spy} from '../../../testutils';

import IntegerInput from '../IntegerInput';
import Input from '../Input';

describe('rex-widget/form', function() {

  describe('<IntegerInput />', function() {

    it('renders', function() {
      let root;
      let onChange = spy();
      let renderer = createRenderer();
      renderer.render(
        <IntegerInput onChange={onChange} />
      );
      root = renderer.element;
      assert(root.type === Input);
      root.props.onChange('12');
      assert(onChange.lastCall.args[0] === 12);
      root.props.onChange('12.');
      assert(onChange.lastCall.args[0] === '12.');
      root.props.onChange('12.2');
      assert(onChange.lastCall.args[0] === '12.2');
      root.props.onChange('xx');
      assert(onChange.lastCall.args[0] === 'xx');
      root.props.onChange('');
      assert(onChange.lastCall.args[0] === undefined);
      renderer.render(
        <IntegerInput onChange={onChange} value={undefined} />
      );
    });

  });

});
