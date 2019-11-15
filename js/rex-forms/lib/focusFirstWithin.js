/**
 * @copyright 2016, Prometheus Research, LLC
 */

import getFocusableElementList from "./getFocusableElementList";

export default function focusFirstWithin(element) {
  if (element) {
    let elements = getFocusableElementList(element).filter(
      item => item.tabIndex >= 0,
    );
    if (elements.length > 0) {
      elements[0].node.focus();
    }
  }
}
