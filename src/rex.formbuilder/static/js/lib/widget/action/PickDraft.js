/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import autobind from 'autobind-decorator';

import {VBox} from 'rex-widget/layout';
import Title from 'rex-action/lib/actions/Title';
import {command, Types} from 'rex-action/lib/execution/Command';

import {GUI, widget} from '../../index';


export default class PickDraft extends React.Component {
  static commands = {
    @command(Types.Value())
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
    let {apiBaseUrl, formPreviewerUrlTemplate, channels,
         locale, i18nBaseUrl} = this.props;

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
              channels={channels}
            />
          }
        />
      </div>
    );
  }

  static renderTitle({title = `Pick Instrument Draft`}, context) {
    let {Primary, Secondary} = Title.stylesheet;
    return (
      <VBox>
        <Primary>{title}</Primary>
        {context.draft && <Secondary>{context.draft}</Secondary>}
      </VBox>
    );
  }
}

