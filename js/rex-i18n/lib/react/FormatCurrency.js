/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */

import React from "react";
import PropTypes from "prop-types";

import I18NContexted from "./I18NContexted";

export default I18NContexted(
  class FormatCurrency extends React.Component {
    static propTypes = {
      value: PropTypes.number.isRequired,
      currency: PropTypes.string.isRequired,
      options: PropTypes.object,
      wrapper: PropTypes.node
    };

    render() {
      let number = this.context.RexI18N.formatCurrency(
        this.props.value,
        this.props.currency,
        this.props.options || {}
      );
      let Wrapper = this.props.wrapper || "span";

      return <Wrapper>{number}</Wrapper>;
    }
  }
);
