/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */

import React from "react";
import PropTypes from "prop-types";

import I18NContexted from "./I18NContexted";

export default I18NContexted(
  class FormatDate extends React.Component {
    static propTypes = {
      value: PropTypes.instanceOf(Date).isRequired,
      format: PropTypes.string,
      wrapper: PropTypes.node
    };

    static defaultProps = {
      format: "medium"
    };

    render() {
      let date = this.context.RexI18N.formatDate(
        this.props.value,
        this.props.format
      );
      let Wrapper = this.props.wrapper || "span";

      return <Wrapper>{date}</Wrapper>;
    }
  }
);
