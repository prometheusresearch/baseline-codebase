/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {spy, createRenderer, assert} from '../../../testutils';

import {Input as BaseInput} from 'react-forms';
import Input from '../Input';


describe('rex-widget/form', function() {

  describe('<Input />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      let onChange = spy();
      renderer.render(
        <Input value="value" onChange={onChange} />
      );
      let input = renderer.findWithElement(<BaseInput />);
      assert(input.props.onChange);
      input.props.onChange('');
      assert(onChange.calledOnce);
      assert(onChange.firstCall.args[0] === null);
      input.props.onChange('some');
      assert(onChange.calledTwice);
      assert(onChange.secondCall.args[0] === 'some');
    });

  });

});

