/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {spy, stub, createRenderer, assert} from '../../../testutils';

import SearchInput, {IconButton} from '../SearchInput';
import Input from '../Input';

describe('rex-widget/form', function() {

  describe('<SearchInput />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders input with value and reacts on change', function() {
      let onChange = spy();
      renderer.render(<SearchInput value="Hi" onChange={onChange} />);
      let input = renderer.findWithElement(<Input />);
      assert(input.props.onChange);
      assert(input.props.value === 'Hi');
      input.props.onChange('Hi!');
      assert(onChange.calledOnce);
      assert(onChange.firstCall.args.length === 1);
      assert(onChange.firstCall.args[0] === 'Hi!');
    });

    it('renders remove button if value is not empty', function() {
      renderer.render(<SearchInput value="Hi" />);
      renderer.assertElement(<IconButton name="remove" />);
    });

    it('does not render remove button if value is empty', function() {
      renderer.render(<SearchInput value="" />);
      renderer.assertNoElement(<IconButton name="remove" />);
      renderer.render(<SearchInput value={null} />);
      renderer.assertNoElement(<IconButton name="remove" />);
    });

    it('clears value on click on remove button', function() {
      let onChange = spy();
      renderer.render(<SearchInput value="Value" onChange={onChange} />);
      let button = renderer.findWithElement(<IconButton name="remove" />);
      stub(renderer.instance, 'focus');
      assert(button.props.onClick);
      button.props.onClick();
      assert(onChange.calledOnce);
      assert(onChange.firstCall.args.length === 1);
      assert(onChange.firstCall.args[0] === null);
      assert(renderer.instance.focus.calledOnce);
    });

  });

});
