/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {createValue} from 'react-forms';

import {createRenderer, assert, stub} from '../../../testutils';
import {Preloader} from '../../ui';
import {RadioGroupField, Title, fetch} from '../RadioGroupField';
import Field from '../Field';
import RadioGroup from '../RadioGroup';
import ReadOnlyField from '../ReadOnlyField';

describe('rex-widget/form', function() {

  let options = [
    {id: 'a', title: 'A'},
    {id: 'b', title: 'B'}
  ];

  describe('<RadioGroupField />', function() {

    let renderer = null;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders in input mode', function() {
      let formValue = createValue({schema: null, value: 'a'});
      renderer.render(
        <RadioGroupField
          formValue={formValue}
          options={options}
          />
      );
      let root = renderer.element;
      assert(root.type === Field);
      assert(root.props.children.type === RadioGroup);
      assert(root.props.children.props.options === options);
    });

    it('renders in input mode (producible options)', function() {
      let root;
      let options = {};
      let formValue = createValue({schema: null, value: 'a'});
      renderer.render(
        <RadioGroupField
          formValue={formValue}
          options={options}
          fetched={{options: {updating: true}}}
          />
      );
      root = renderer.element;
      assert(root.type === Field);
      assert(root.props.children.type === Preloader);
      renderer.render(
        <RadioGroupField
          formValue={formValue}
          options={options}
          fetched={{options: {updating: false, data: 'x'}}}
          />
      );
      root = renderer.element;
      assert(root.type === Field);
      assert(root.props.children.type === RadioGroup);
      assert(root.props.children.props.options === 'x');
    });

    it('renders in read only mode', function() {
      let formValue = createValue({schema: null, value: 'a'});
      renderer.render(
        <RadioGroupField readOnly formValue={formValue} options={options} />
      );
      let root = renderer.element;
      assert(root.type === ReadOnlyField);
      assert(root.props.children.type === Title);
      assert(root.props.children.props.options === options);
    });

    it('renders in read only mode (producible options)', function() {
      let options = {};
      let root;
      let formValue = createValue({schema: null, value: 'a'});

      renderer.render(
        <RadioGroupField
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
        <RadioGroupField
          readOnly
          formValue={formValue}
          options={options}
          fetched={{options: {updating: false, data: 'x'}}}
          />
      );
      root = renderer.element;
      assert(root.type === ReadOnlyField);
      assert(root.props.children.type === Title);
      assert(root.props.children.props.options === 'x');
    });

    describe('<Title />', function() {

      it('renders', function() {
        renderer.render(
          <Title
            value="a"
            options={options}
            />
        );
        assert(renderer.element.props.children === 'A');
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

