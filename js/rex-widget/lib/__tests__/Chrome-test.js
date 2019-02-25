/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {spy, stub, createRenderer, assert} from '../../testutils';

import Chrome from '../Chrome';

describe('rex-widget', function() {

  describe('<Chrome />', function() {

    let renderer;
    let originalDocumentTitle;

    beforeEach(function() {
      renderer = createRenderer();
      originalDocumentTitle = document.title;
      document.title = 'Hi';
    });

    afterEach(function() {
      document.title = originalDocumentTitle;
    });

    it('renders', function() {
      renderer.render(<Chrome content={<span />} />);
      assert(document.title === 'Hi');
      renderer.assertElement(<span />);
      renderer.render(<Chrome content={<span />}><b /></Chrome>);
      renderer.assertElement(<b />);
      renderer.assertNoElement(<span />);
    });

    it('sets title', function() {
      renderer.render(<Chrome title="Hey" />);
      renderer.instance.componentDidMount();
      assert(document.title === 'Hey');
    });

    it('updates title', function() {
      renderer.render(<Chrome title="Hey" />);
      renderer.instance.componentDidMount();
      assert(document.title === 'Hey');
      renderer.render(<Chrome title="Hi" />);
      renderer.instance.componentDidUpdate();
      assert(document.title === 'Hi');
    });
  });

});
