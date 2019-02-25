/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer, assert, spy} from 'rex-widget/testutils';
import {Icon} from 'rex-widget/ui';
import ActionIcon from '../ActionIcon';

describe('rex-action', function() {
  describe('<ActionIcon />', function() {
    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      let position;

      position = {instruction: {action: {element: null}}};
      renderer.render(<ActionIcon position={position} />);
      assert(renderer.element === null);

      position = {
        instruction: {
          action: {
            element: {
              type: {
                getIcon() {
                  return 'getIcon';
                },
              },
            },
          },
        },
      };
      renderer.render(<ActionIcon position={position} />);
      renderer.assertElementWithTypeProps(Icon, {name: 'getIcon'});

      position = {instruction: {action: {element: {type: {}, props: {icon: 'props'}}}}};
      renderer.render(<ActionIcon position={position} />);
      renderer.assertElementWithTypeProps(Icon, {name: 'props'});

      position = {
        instruction: {
          action: {element: {type: {defaultProps: {icon: 'defaultProps'}}, props: {}}},
        },
      };
      renderer.render(<ActionIcon position={position} />);
      renderer.assertElementWithTypeProps(Icon, {name: 'defaultProps'});

      position = {
        instruction: {
          action: {
            element: {
              type: {
                getDefaultProps() {
                  return {icon: 'getDefaultProps'};
                },
              },
              props: {},
            },
          },
        },
      };
      renderer.render(<ActionIcon position={position} />);
      renderer.assertElementWithTypeProps(Icon, {name: 'getDefaultProps'});

      position = {instruction: {action: {element: {type: {}, props: {}}}}};
      renderer.render(<ActionIcon position={position} />);
      assert(renderer.element === null);
    });
  });
});
