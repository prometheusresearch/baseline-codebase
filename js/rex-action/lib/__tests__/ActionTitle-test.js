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

    function CustomTitle() {}

    it('renders', function() {
      let position;
      let title;

      position = {
        instruction: {
          action: {
            element: {
              type: {
                renderTitle() {
                  return <CustomTitle />;
                },
              },
            },
          },
        },
      };

      renderer.render(<ActionTitle position={position} />);
      renderer.assertElementWithTypeProps(CustomTitle);

      position = {
        instruction: {
          action: {
            element: {
              type: {
                getTitle() {
                  return 'TITLE';
                },
              },
            },
          },
        },
      };
      renderer.render(<ActionTitle position={position} />);
      assert(renderer.element.props.children === 'TITLE');

      position = {instruction: {action: {element: {type: {}, props: {title: 'props'}}}}};
      renderer.render(<ActionTitle position={position} />);
      assert(renderer.element.props.children === 'props');

      position = {
        instruction: {
          action: {element: {type: {defaultProps: {title: 'defaultProps'}}, props: {}}},
        },
      };
      renderer.render(<ActionTitle position={position} />);
      assert(renderer.element.props.children === 'defaultProps');

      position = {
        instruction: {
          action: {
            element: {
              type: {
                getDefaultProps() {
                  return {title: 'getDefaultProps'};
                },
              },
              props: {},
            },
          },
        },
      };
      renderer.render(<ActionTitle position={position} />);
      assert(renderer.element.props.children === 'getDefaultProps');
    });
  });
});
