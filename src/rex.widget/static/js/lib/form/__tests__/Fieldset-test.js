/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer} from '../../../testutils';

import Fieldset from '../Fieldset';
import {FieldsetHeader} from '../ui';
import {Fieldset as FieldsetBase} from 'react-forms';

describe('rex-widget/form', function() {

  describe('<Fieldset />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      renderer.render(<Fieldset />);
      renderer.assertElementWithTypeProps(FieldsetBase);
    });

    it('renders with label', function() {
      renderer.render(<Fieldset label="Hello" />);
      renderer.assertElementWithTypeProps(FieldsetBase);
      renderer.assertElementWithTypeProps(FieldsetHeader);
    });
  });

});
