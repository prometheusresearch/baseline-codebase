/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */

import React from "react";

import I18NContexted from "./I18NContexted";

export default I18NContexted(
  class FormatDateTime extends React.Component {
    static propTypes = {
      value: React.PropTypes.instanceOf(Date).isRequired,
      format: React.PropTypes.string,
      wrapper: React.PropTypes.element
    };

    static defaultProps = {
      format: "medium"
    };
    render() {
      let date = this.context.RexI18N.formatDateTime(
        this.props.value,
        this.props.format
      );
      let Wrapper = this.props.wrapper || "span";

      return <Wrapper>{date}</Wrapper>;
    }
  }
);
