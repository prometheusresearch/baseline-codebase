/**
 * @copyright 2015, David Clark
 * @copyright 2016, Prometheus Research, LLC
 *
 * Based on code found in https://github.com/davidtheclark/tabbable
 */

const FOCUSABLE_SELECTOR = 'input, select, a[href], textarea, button, [tabindex]';

export default function getFocusableElementList(el) {
  let basicTabbables = [];
  let orderedTabbables = [];
  let isHidden = createIsHidden();

  let nodes = el.querySelectorAll(FOCUSABLE_SELECTOR);

  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    let tabIndex = node.tabIndex;

    if (isHiddenInput(node) || node.disabled || isHidden(node)) {
      continue;
    }

    if (tabIndex <= 0) {
      basicTabbables.push({tabIndex, node});
    } else {
      orderedTabbables.push({tabIndex, node});
    }
  }

  orderedTabbables = orderedTabbables
    .sort((a, b) => a.tabIndex - b.tabIndex);

  return orderedTabbables.concat(basicTabbables);
}

function isHiddenInput(node) {
  return node.tagName === 'INPUT' && node.type === 'hidden';
}

function createIsHidden() {
  // Node cache must be refreshed on every check, in case
  // the content of the element has changed
  let nodeCache = [];

  return function isHidden(node) {
    if (node === document.documentElement) {
      return false;
    }

    // Find the cached node (Array.prototype.find not available in IE9)
    for (let i = 0, length = nodeCache.length; i < length; i++) {
      if (nodeCache[i][0] === node) {
        return nodeCache[i][1];
      }
    }

    let result = false;
    let style = window.getComputedStyle(node);
    if (style.visibility === 'hidden' || style.display === 'none') {
      result = true;
    } else if (node.parentNode) {
      result = isHidden(node.parentNode);
    }

    nodeCache.push([node, result]);

    return result;
  };
}
