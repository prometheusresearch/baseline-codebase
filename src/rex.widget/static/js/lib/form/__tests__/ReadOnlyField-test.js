/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer} from '../../../testutils';

import {createValue} from 'react-forms';
import {ReadOnlyField} from '../ReadOnlyField';


describe('rex-widget/form', function() {

  describe('<ReadOnlyField />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders (no children)', function() {
      let formValue = createValue({value: {a: 1}});
      renderer.render(
        <ReadOnlyField formValue={formValue.select('a')} />
      );
    });

    it('renders (children)', function() {
      let formValue = createValue({value: {a: 1}});
      renderer.render(
        <ReadOnlyField formValue={formValue.select('a')}>
          <span />
        </ReadOnlyField>
      );
      renderer.assertElement(<span />);
    });

  });

});
