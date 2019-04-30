import React from "react";
import { Action } from "rex-action";
import { VBox } from "@prometheusresearch/react-box";
import { withFetch } from "rex-widget/data";
import * as rexui from 'rex-ui';

export default withFetch(
  class ViewSource extends React.Component {
    static defaultProps = {
      icon: "file"
    };

    render() {
      let { title, context } = this.props;
      let { dump } = this.props.fetched;
      return (
        <Action title={`${title}: ${context.table}`} noContentWrapper>
          <VBox flex={1}>
            {dump.updating ? (
              <rexui.PreloaderScreen />
            ) : (
              <VBox flex={1} style={{ padding: "15px" }}>
                <textarea
                  readOnly
                  value={dump.data.dump}
                  style={{
                    width: "100%",
                    height: "100%",
                    fontFamily: "monospace"
                  }}
                />
              </VBox>
            )}
          </VBox>
        </Action>
      );
    }
  },
  ({ context, dump }) => {
    return {
      dump: dump.params(context)
    };
  }
);
