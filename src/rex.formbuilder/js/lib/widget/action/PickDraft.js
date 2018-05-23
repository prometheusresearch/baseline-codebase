/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import autobind from 'autobind-decorator';
import objectPath from 'object-path';

import {VBox} from 'rex-widget/layout';
import {Preloader} from 'rex-widget/ui';
import {Fetch} from 'rex-widget/data';
import {TitleBase, Command} from 'rex-action';

import * as GUI from '../../gui';
import * as widget from '../../widget';


@Fetch(function (props) {
  let channels = props.channels;
  Object.keys(props.channelFilter).forEach((key) => {
    channels = channels.params({
      [key]: objectPath.get(props, props.channelFilter[key])
    });
  });
  return {channels};
})
export default class PickDraft extends React.Component {
  static commands = {
    @Command.command(Command.Types.Value())
    default(props, context, draft) {
      if (draft != null) {
        return {...context, draft: draft};
      } else {
        return context;
      }
    }
  };

  @autobind
  onDraftSelected(draft) {
    this.props.onCommand('default', draft.uid);
  }

  render() {
    let WrapperStyle = {
     display: 'flex',
     width: '100%',
     height: '100%',
     overflow: 'auto'
    };
    let {apiBaseUrl, formPreviewerUrlTemplate,
         locale, i18nBaseUrl} = this.props;
    let {channels} = this.props.fetched;

    if (channels.updating) {
      return <Preloader />;
    }

    return (
      <div
        flex="1"
        style={WrapperStyle}>
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

  static renderTitle({title = `Pick Instrument Draft`}, context) {
    return <TitleBase title={title} subtitle={context.draft} />
  }
}

