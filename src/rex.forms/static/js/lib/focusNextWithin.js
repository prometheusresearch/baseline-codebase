/**
 * @copyright 2016, Prometheus Research, LLC
 */

import getFocusableElementList from './getFocusableElementList';

export default function focusNextWithin(root, after = document.activeElement) {
  let elements = getFocusableElementList(root);
  let nodes = elements.map(item => item.node);
  while (true) { // eslint-disable-line no-constant-condition
    let idx = nodes.indexOf(after);
    if (idx === -1) {
      if (!after.parentNode) {
        return;
      } else {
        after = after.parentNode;
      }
    } else {
      let nextElements = elements
        .slice(idx + 1)
        .filter(item => item.tabIndex >= 0);
      if (nextElements.length > 0) {
        nextElements[0].node.focus();
      }
      return;
    }
  }
}

