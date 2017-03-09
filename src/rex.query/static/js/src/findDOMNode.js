/**
 * @flow
 */

import invariant from 'invariant';
import * as ReactDOM from 'react-dom';

export default function findDOMNode(component: any): HTMLElement {
  const element = ReactDOM.findDOMNode(component);
  invariant(element != null && element instanceof HTMLElement, 'Expected HTMLElement');
  return element;
}
