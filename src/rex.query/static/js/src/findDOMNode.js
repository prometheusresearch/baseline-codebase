/**
 * @flow
 */

import invariant from 'invariant';
import * as ReactDOM from 'react-dom';

export function findDOMNode(component: any): ?HTMLElement {
  const element = ReactDOM.findDOMNode(component);
  invariant(element == null || element instanceof HTMLElement, 'Expected HTMLElement');
  return element;
}

export function findDOMNodeStrict(component: any): HTMLElement {
  const element = ReactDOM.findDOMNode(component);
  invariant(element != null && element instanceof HTMLElement, 'Expected HTMLElement');
  return element;
}

export default findDOMNode;
