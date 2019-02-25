/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from "react";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import toString from "lodash/toString";

import { InjectI18N } from "rex-i18n";

const textStyle = {
  width: "100%",
  display: "inline-block",
  wordWrap: "break-word",
  whiteSpace: "normal"
};

export default InjectI18N(
  class ViewValue extends React.Component {
    static defaultProps = {
      stylesheet: {
        Root: props => <ReactUI.Block marginStart="small" {...props} />,
        Text: props => (
          <ReactUI.Text style={{ ...textStyle, ...props.style }} {...props} />
        )
      }
    };

    getValueString() {
      if (this.props.formValue.value != null) {
        return toString(this.props.formValue.value);
      }
      return null;
    }

    render() {
      let { noValueText = this._("No Value") } = this.props;
      let { Root, Text } = this.props.stylesheet;
      let valueString = this.getValueString();

      return (
        <Root>
          {valueString === null ? (
            <Text color="#888">{noValueText}</Text>
          ) : (
            <Text>{valueString}</Text>
          )}
        </Root>
      );
    }
  }
);
