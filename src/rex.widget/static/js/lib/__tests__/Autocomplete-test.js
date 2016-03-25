/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import AutocompleteBase from '@prometheusresearch/react-autocomplete';
import {createRenderer, assertElement, spy, stub} from '../../testutils';

import {createValue} from 'react-forms';
import {delay} from '../../lang';
import {port} from '../../data';
import {IconButton} from '../../ui';
import Autocomplete from '../Autocomplete';

describe('rex-widget', function() {

  describe('<Autocomplete />', function() {

    let originalFetch;

    function stubFetch(returns) {
      let payload = Promise.resolve(returns);
      let response = Promise.resolve({
        status: 200,
        json() {
          return payload;
        }
      });
      return global.fetch = stub().returns(response);
    }

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
      originalFetch = global.fetch;
    });

    afterEach(function() {
      global.fetch = originalFetch;
    });

    it('renders autocomplete and fetches value', async function() {
      let root;
      let fetch = stubFetch({obj: [{id: "id", title: "Title"}]});
      let formValue = createValue({params: {context: {a: 'b'}}});

      renderer.render(
        <Autocomplete value="id" data={port("/path")} formValue={formValue} />
      );

      renderer.assertElement(
        <AutocompleteBase value={{id: 'id'}} />
      );
      renderer.assertElement(
        <IconButton name="remove" />
      );

      renderer.instance.componentDidMount();
      await delay(5);
      assert(fetch.callCount === 1);

      renderer.assertElement(
        <AutocompleteBase value={{id: 'id', title: 'Title'}} />
      );
    });

    it('handles onChange', async function() {
      let autocomplete;
      let formValue = createValue({params: {context: {a: 'b'}}});
      let onChange = spy();
      let fetch = stubFetch({obj: [{id: "id", title: "Title"}]});

      renderer.render(
        <Autocomplete
          value="id"
          data={port("/path")}
          formValue={formValue}
          onChange={onChange}
          />
      );

      autocomplete = renderer.findWithElement(<AutocompleteBase />);
      assert(autocomplete.props.onChange);
      autocomplete.props.onChange({id: 'id'});
      assert(onChange.callCount === 1);
      assert.deepEqual(onChange.firstCall.args, ['id']);
      assert(!fetch.calledOnce);
      autocomplete.props.onChange(null);
      assert(onChange.callCount === 2);
      assert.deepEqual(onChange.secondCall.args, [null]);
      assert(fetch.calledOnce);
    });

    it('clears value on a clear button click', async function() {
      let formValue = createValue({params: {context: {a: 'b'}}});
      let onChange = spy();
      let fetch = stubFetch({obj: [{id: "id", title: "Title"}]});

      renderer.render(
        <Autocomplete
          value="id"
          data={port("/path")}
          formValue={formValue}
          onChange={onChange}
          />
      );

      let clearButton = renderer.findWithElement(<IconButton name="remove" />);
      assert(clearButton.props.onClick);
      clearButton.props.onClick();
      assert(onChange.callCount === 1);
      assert.deepEqual(onChange.firstCall.args, [null]);
      assert(fetch.calledOnce);
    });

    it('searches via data prop', function(done) {
      let autocomplete;
      let formValue = createValue({params: {context: {a: 'b'}}});
      let onChange = spy();
      let fetch = stubFetch({obj: [{id: "id", title: "Title"}]});

      renderer.render(
        <Autocomplete
          value="id"
          data={port("/path")}
          formValue={formValue}
          onChange={onChange}
          debounce={0}
          />
      );

      autocomplete = renderer.findWithElement(<AutocompleteBase />);
      assert(autocomplete.props.search);
      autocomplete.props.search(null, 'term', function(err, result) {
        assert(err === null);
        assert.deepEqual(result, [{id: "id", title: "Title"}]);
        done();
      });
    });

  });

});
