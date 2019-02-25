/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from "react";

import { InjectI18N } from "rex-i18n";

const POSITION_TOP = 1 / 3;
const POSITION_BOTTOM = 2 / 3;

export default InjectI18N(
  class PositionDescription extends React.Component {
    render() {
      let { id, pageNumber, elementNumber, elementCount } = this.props;
      pageNumber = pageNumber + 1;

      let desc = "";
      let vars = { page: pageNumber, field: id };
      if (elementCount < 3) {
        desc = this._("On Page %(page)s (%(field)s)", vars);
      } else {
        let relativePosition = elementNumber / elementCount;
        if (relativePosition <= POSITION_TOP) {
          desc = this._("Top of Page %(page)s (%(field)s)", vars);
        } else if (relativePosition >= POSITION_BOTTOM) {
          desc = this._("Bottom of Page %(page)s (%(field)s)", vars);
        } else {
          desc = this._("Middle of Page %(page)s (%(field)s)", vars);
        }
      }

      return <span>{desc}</span>;
    }
  }
);
