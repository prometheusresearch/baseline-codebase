/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import autobind from 'autobind-decorator';

import {ConfirmNavigation} from 'rex-action';

import {GUI, widget} from '../../index';


export default class EditDraft extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      draftModified: false
    };
  }

  @autobind
  onDraftModified(draftModified) {
    if (this.state.draftModified != draftModified) {
      this.setState({draftModified});
    }
  }

  render() {
    let WrapperStyle = {
     display: 'flex',
     width: '100%',
     height: '100%',
     overflow: 'auto'
    };
    let {apiBaseUrl, formPreviewerUrlTemplate, channels, context,
         locale, i18nBaseUrl} = this.props;
    return (
      <div
        key="wrapper"
        flex="1"
        style={WrapperStyle}>
        {this.state.draftModified &&
          <ConfirmNavigation
            key="confirm"
            message={GUI.DraftSetEditor.getUnsavedMessage()}
          />
        }
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
              channels={channels}
              onModified={this.onDraftModified}
            />
          }
        />
      </div>
    );
  }
}

