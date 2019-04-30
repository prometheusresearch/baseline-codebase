/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";
import PropTypes from "prop-types";

import { InjectI18N } from "rex-i18n";

import * as FormContext from "./FormContext";
import isReactElement from "../isReactElement";
import getLocalizedString from "../getLocalizedString";

const textStyle = {
  width: "100%",
  wordWrap: "break-word",
  whiteSpace: "normal"
};

export default InjectI18N(
  class LocalizedString extends React.Component {
    static propTypes = {
      text: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
    };

    static contextTypes = FormContext.contextTypes;

    static defaultProps = {
      Component: "span"
    };

    render() {
      let { Component, text, ...props } = this.props;

      let localizedText;
      if (isReactElement(text)) {
        localizedText = text;
      } else {
        localizedText = getLocalizedString(
          text,
          this.getI18N(),
          this.context.defaultLocalization
        );
      }

      return (
        <Component style={{ ...textStyle, ...props.style }} {...props}>
          {localizedText}
        </Component>
      );
    }
  }
);
