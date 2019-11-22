/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import ViewValue from "./ViewValue";

export default class ViewBooleanValue extends ViewValue {
  getValueString() {
    if (this.props.formValue.value != null) {
      return this.props.formValue.value ? this._("Yes") : this._("No");
    }
    return null;
  }
}
