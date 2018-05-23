/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {createValue} from 'react-forms';

import {createRenderer, assert, stub} from '../../../testutils';
import {Preloader} from '../../ui';
import {CheckboxGroupField, TitleList, fetch} from '../CheckboxGroupField';
import Field from '../Field';
import CheckboxGroup from '../CheckboxGroup';
import ReadOnlyField from '../ReadOnlyField';

describe('rex-widget/form', function() {

  let options = [
    {id: 'a', title: 'A'},
    {id: 'b', title: 'B'}
  ];

  describe('<CheckboxGroupField />', function() {

    let renderer = null;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders in input mode', function() {
      let formValue = createValue({schema: null, value: ['a', 'b']});
      renderer.render(
        <CheckboxGroupField
          formValue={formValue}
          options={options}
          />
      );
      let root = renderer.element;
      assert(root.type === Field);
      assert(root.props.children.type === CheckboxGroup);
      assert(root.props.children.props.options === options);
    });

    it('renders in input mode (producible options)', function() {
      let root;
      let options = {};
      let formValue = createValue({schema: null, value: ['a', 'b']});
      renderer.render(
        <CheckboxGroupField
          formValue={formValue}
          options={options}
          fetched={{options: {updating: true}}}
          />
      );
      root = renderer.element;
      assert(root.type === Field);
      assert(root.props.children.type === Preloader);
      renderer.render(
        <CheckboxGroupField
          formValue={formValue}
          options={options}
          fetched={{options: {updating: false, data: 'x'}}}
          />
      );
      root = renderer.element;
      assert(root.type === Field);
      assert(root.props.children.type === CheckboxGroup);
      assert(root.props.children.props.options === 'x');
    });

    it('renders in read only mode', function() {
      let formValue = createValue({schema: null, value: ['a', 'b']});
      renderer.render(
        <CheckboxGroupField readOnly formValue={formValue} options={options} />
      );
      let root = renderer.element;
      assert(root.type === ReadOnlyField);
      assert(root.props.children.type === TitleList);
      assert(root.props.children.props.options === options);
    });

    it('renders in read only mode (producible options)', function() {
      let options = {};
      let root;
      let formValue = createValue({schema: null, value: ['a', 'b']});

      renderer.render(
        <CheckboxGroupField
          readOnly
          formValue={formValue}
          options={options}
          fetched={{options: {updating: true}}}
          />
      );
      root = renderer.element;
      assert(root.type === ReadOnlyField);
      assert(root.props.children.type === Preloader);

      renderer.render(
        <CheckboxGroupField
          readOnly
          formValue={formValue}
          options={options}
          fetched={{options: {updating: false, data: 'x'}}}
          />
      );
      root = renderer.element;
      assert(root.type === ReadOnlyField);
      assert(root.props.children.type === TitleList);
      assert(root.props.children.props.options === 'x');
    });

    describe('<TitleList />', function() {

      it('renders', function() {
        renderer.render(
          <TitleList
            value={['a', 'b']}
            options={options}
            />
        );
        assert(renderer.element.props.children === 'A, B');
      });
    });

    describe('fetch', function() {

      it('fetches nothing if options are defined as array', function() {
        assert.deepEqual(fetch({options}), {});
      });

      it('fetches options', function() {
        let formValue = {params: {context: {a: 42}}};
        let options = {params: stub().returns('ok')};
        let tasks = fetch({options, formValue});
        assert(tasks.options === 'ok');
        assert(options.params.calledOnce);
        assert.deepEqual(options.params.lastCall.args[0], {':a': 42});
      });
    });

  });

});
