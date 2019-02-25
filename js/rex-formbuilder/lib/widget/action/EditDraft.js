/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";
import objectPath from "object-path";

import { ConfirmNavigation } from "rex-action";
import { Preloader } from "rex-widget/ui";
import { withFetch } from "rex-widget/data";

import * as GUI from "../../gui";
import * as widget from "../../widget";
import i18n from "../../i18n";

let _ = i18n.gettext;

export default withFetch(
  class EditDraft extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        draftModified: false
      };
    }

    onDraftModified = draftModified => {
      if (this.state.draftModified != draftModified) {
        this.setState({ draftModified });
      }
    };

    render() {
      let WrapperStyle = {
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "auto"
      };
      let {
        apiBaseUrl,
        formPreviewerUrlTemplate,
        context,
        locale,
        i18nBaseUrl
      } = this.props;
      let { channels } = this.props.fetched;

      if (channels.updating) {
        return <Preloader />;
      }
      return (
        <div key="wrapper" flex="1" style={WrapperStyle}>
          {this.state.draftModified && (
            <ConfirmNavigation key="confirm" message={getUnsavedMessage()} />
          )}
          <widget.I18NWidget
            key="i18n"
            locale={locale}
            i18nBaseUrl={i18nBaseUrl}
            content={
              <GUI.DraftSetEditor
                key="editor"
                apiBaseUrl={apiBaseUrl}
                formPreviewerUrlTemplate={formPreviewerUrlTemplate}
                uid={context.draft}
                channels={channels.data.channels}
                onModified={this.onDraftModified}
              />
            }
          />
        </div>
      );
    }
  },
  function(props) {
    let channels = props.channels;
    Object.keys(props.channelFilter).forEach(key => {
      channels = channels.params({
        [key]: objectPath.get(props, props.channelFilter[key])
      });
    });
    return { channels };
  }
);

//moved from DraftSetEditor
function getUnsavedMessage() {
  return _("You've made changes to this Draft, but haven't saved them yet.");
}
