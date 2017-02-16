/**
 * @copyright 2016, Prometheus Research, LLC
 */

import Sinon from 'sinon';
import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import {findWithType, findAllWithType} from 'react-shallow-testutils';
import {createValue} from 'react-forms';

import {Field} from '../Field';
import Input from '../Input';
import ErrorList from '../ErrorList';

describe('rex-widget/form', function() {

  describe('<Field/>', function() {

    let schema = {
      type: 'object',
      properties: {
        num: {type: 'number'},
      }
    };

    it('marks field as dirty (onBlur)', function() {
      let renderer = TestUtils.createRenderer();
      let formValue = createValue({schema, value: {num: 'xxx'}});
      renderer.render(
        <Field formValue={formValue.select('num')} />
      );
      let root = renderer.getRenderOutput();
      assert(findAllWithType(root, ErrorList).length === 0);
      let input = findWithType(root, Input);
      assert(input);
      assert(input.props.onBlur);
      input.props.onBlur();
      root = renderer.getRenderOutput();
      assert(findAllWithType(root, ErrorList).length === 1);
    });

    it('marks field as dirty (onChange)', function() {
      let renderer = TestUtils.createRenderer();
      let formValue = createValue({schema, value: {num: 'xxx'}});
      renderer.render(
        <Field formValue={formValue.select('num')} />
      );
      let root = renderer.getRenderOutput();
      assert(findAllWithType(root, ErrorList).length === 0);
      let input = findWithType(root, Input);
      assert(input);
      assert(input.props.onChange);
      input.props.onChange('yyy');
      root = renderer.getRenderOutput();
      assert(findAllWithType(root, ErrorList).length === 1);
    });

    it('is compatible with DOM input', function() {
      let renderer = TestUtils.createRenderer();
      let formValue = createValue({schema, value: {num: 'xxx'}});
      renderer.render(
        <Field formValue={formValue.select('num')}>
          <input />
        </Field>
      );
      let root = renderer.getRenderOutput();
      assert(findAllWithType(root, ErrorList).length === 0);
      let input = findWithType(root, 'input');
      assert(input);
      assert(input.props.onChange);
      let event = {
        target: {value: 'yyy'},
        stopPropagation: Sinon.spy(),
      };
      input.props.onChange(event);
      root = renderer.getRenderOutput();
      assert(findAllWithType(root, ErrorList).length === 1);
      assert(event.stopPropagation.calledOnce);
    });

  });
});
