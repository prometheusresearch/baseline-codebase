/**
 * @copyright 2015, Prometheus Research, LLC
 */

import invariant           from 'invariant';
import notifyLayoutChange  from './notifyLayoutChange';

export default {

  componentWillMount() {
    invariant(
      typeof this.onLayoutChange === 'function',
      'Component "%s" which uses LayoutAwareMixin should define onLayoutChange callback',
      this.constructor.displayName
    );
  },

  componentDidMount() {
    window.addEventListener('resize', this.onLayoutChange);
    window.addEventListener(notifyLayoutChange.EVENT_NAME, this.onLayoutChange);
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.onLayoutChange);
    window.removeEventListener(notifyLayoutChange.EVENT_NAME, this.onLayoutChange);
  }

};
