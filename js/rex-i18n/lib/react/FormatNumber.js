/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */

import React from "react";

import I18NContexted from "./I18NContexted";

export default I18NContexted(
  class FormatNumber extends React.Component {
    static propTypes = {
      value: React.PropTypes.number.isRequired,
      options: React.PropTypes.object,
      wrapper: React.PropTypes.element
    };

    render() {
      let number = this.context.RexI18N.formatNumber(
        this.props.value,
        this.props.options || {}
      );
      let Wrapper = this.props.wrapper || "span";

      return <Wrapper>{number}</Wrapper>;
    }
  }
);
