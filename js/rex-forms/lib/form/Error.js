/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import LocalizedString from "./LocalizedString";
import MarkupString from "./MarkupString";

function ErrorText(props) {
  return (
    <MarkupString
      {...props}
      inline
      fontSize="x-small"
      Component={ReactUI.ErrorText}
    />
  );
}

export default function Error({ text, children }) {
  text = text || children;
  return <LocalizedString text={text} Component={ErrorText} />;
}
