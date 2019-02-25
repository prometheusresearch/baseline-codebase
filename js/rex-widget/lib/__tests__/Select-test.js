/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {spy, stub, createRenderer, assert} from '../../testutils';

import Select from '../Select';
import BaseSelect from '../BaseSelect';

describe('rex-widget', function() {

  describe('<Select />', function() {

    let renderer;
    let originalDocumentTitle;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      let options = [{id: 'id', label: 'Label'}];
      renderer.render(<Select options={options} />);
      renderer.assertElement(<BaseSelect />);
    });

    it('sets first value if noEmptyValue is provided', function() {
      let options = [{id: 'id', label: 'Label'}];
      let onChange = spy();
      renderer.render(<Select options={options} onChange={onChange} noEmptyValue />);
      renderer.instance.componentDidMount();
      assert(onChange.calledOnce);
    });

    it('sets first value if noEmptyValue is provided', function() {
      let options = [{id: 'id', label: 'Label'}];
      let onChange = spy();
      renderer.render(<Select options={options} onChange={onChange} noEmptyValue />);
      renderer.instance.componentDidUpdate();
      assert(onChange.calledOnce);
    });
  });

});

