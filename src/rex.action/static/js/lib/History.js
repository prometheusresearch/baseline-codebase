/**
 * @copyright 2016, Prometheus Research, LLC
 */

import createHistory from 'history/lib/createHashHistory';

export {createLocation} from 'history';

let _history = null;

export function getHistory() {
  if (_history === null) {
    _history = createHistory();
  }
  return _history;
}
