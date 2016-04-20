/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer, assert, spy} from 'rex-widget/testutils';
import ActionTitle from '../ActionTitle';

describe('rex-action', function() {

  describe('<ActionTitle />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    function CustomTitle() {
    }

    it('renders', function() {
      let node;
      let title;

      node = {element: {type: {renderTitle() { return <CustomTitle />; }}}};
      renderer.render(<ActionTitle node={node} />);
      renderer.assertElementWithTypeProps(CustomTitle);

      node = {element: {type: {getTitle() { return 'TITLE'; }}}};
      renderer.render(<ActionTitle node={node} />);
      title = renderer.findWithTypeProps(ActionTitle.stylesheet.Primary);
      assert(title.props.children === 'TITLE');

      node = {element: {type: {}, props: {title: 'props'}}};
      renderer.render(<ActionTitle node={node} />);
      title = renderer.findWithTypeProps(ActionTitle.stylesheet.Primary);
      assert(title.props.children === 'props');

      node = {element: {type: {defaultProps: {title: 'defaultProps'}}, props: {}}};
      renderer.render(<ActionTitle node={node} />);
      title = renderer.findWithTypeProps(ActionTitle.stylesheet.Primary);
      assert(title.props.children === 'defaultProps');

      node = {element: {type: {getDefaultProps() { return {title: 'getDefaultProps'}; }}, props: {}}};
      renderer.render(<ActionTitle node={node} />);
      title = renderer.findWithTypeProps(ActionTitle.stylesheet.Primary);
      assert(title.props.children === 'getDefaultProps');

    });

  });

});


