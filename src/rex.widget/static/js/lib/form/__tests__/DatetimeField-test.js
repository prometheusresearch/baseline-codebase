/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {createValue} from 'react-forms';
import {assert, createRenderer, spy} from '../../../testutils';

import {DatetimePicker, DatetimeField} from '../DatetimeField';
import DatetimeInput from '../DatetimeInput';
import Field from '../Field';
import ReadOnlyField from '../ReadOnlyField';

describe('rex-widget/form', function() {

  let renderer;

  beforeEach(function() {
    renderer = createRenderer();
  });

  describe('<DatetimeField />', function() {

    it('renders in input mode', function() {
      let formValue = createValue({schema: null, value: false});
      renderer.render(
        <DatetimeField
          formValue={formValue}
          />
      );
      assert(renderer.element.type === Field);
      assert(renderer.element.props.children.type === DatetimePicker);
    });

    it('renders in read only mode', function() {
      let formValue = createValue({schema: null, value: '2012-12-12 12:12:12'});
      renderer.render(
        <DatetimeField readOnly formValue={formValue} />
      );
      assert(renderer.element.type === ReadOnlyField);
      assert(renderer.element.props.children === '2012-12-12 12:12:12');
    });

  });

  describe('<DatetimePicker />', function() {

    it('renders', function() {
      let onChange = spy();
      renderer.render(
        <DatetimePicker value="2012-12-12 12:12:12" onChange={onChange} />
      );
      renderer.assertElement(<DatetimeInput />);
      assert(renderer.element.props.dateTime);
      renderer.render(
        <DatetimePicker value="2012-12-12" onChange={onChange} />
      );
      renderer.assertElement(<DatetimeInput />);
      assert(renderer.element.props.dateTime);

      assert(renderer.element.props.onChange);
      renderer.element.props.onChange('date');
      assert(onChange.calledOnce);
      assert(onChange.firstCall.args[0] === 'date');
    });

  });

});
