/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";
import objectPath from "object-path";

import { VBox } from "@prometheusresearch/react-box";
import Preloader from "../../gui/Preloader";
import { withFetch } from "rex-widget/data";
import { TitleBase, Command } from "rex-action";

import * as GUI from "../../gui";
import * as widget from "../../widget";

export default withFetch(
  class PickDraft extends React.Component {
    static commands = {
      default: new Command.Command(
        (props, context, draft) => {
          if (draft != null) {
            return { ...context, draft: draft };
          } else {
            return context;
          }
        },
        "default",
        [Command.Types.Value()]
      )
    };

    onDraftSelected = draft => {
      this.props.onCommand("default", draft.uid);
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
        locale,
        i18nBaseUrl
      } = this.props;
      let { channels } = this.props.fetched;

      if (channels.updating) {
        return <Preloader />;
      }

      return (
        <div flex="1" style={WrapperStyle}>
          <widget.I18NWidget
            locale={locale}
            i18nBaseUrl={i18nBaseUrl}
            content={
              <GUI.InstrumentMenu
                apiBaseUrl={apiBaseUrl}
                formPreviewerUrlTemplate={formPreviewerUrlTemplate}
                uid={this.props.context.instrument.id}
                onDraftSelected={this.onDraftSelected}
                draftSetSelectorVerticalView={true}
                channels={channels.data.channels}
              />
            }
          />
        </div>
      );
    }

    static renderTitle({ title = `Pick Instrument Draft` }, context) {
      return <TitleBase title={title} subtitle={context.draft} />;
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
