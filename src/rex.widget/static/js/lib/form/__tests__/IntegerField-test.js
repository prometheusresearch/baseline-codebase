/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer} from '../../../testutils';

import IntegerField from '../IntegerField';
import IntegerInput from '../IntegerInput';
import Field from '../Field';

describe('rex-widget/form', function() {

  describe('<IntegerField />', function() {

    it('renders', function() {
      let renderer = createRenderer();
      renderer.render(
        <IntegerField />
      );
      renderer.assertElement(<Field />);
      renderer.assertElement(<IntegerInput />);
    });

  });

});
