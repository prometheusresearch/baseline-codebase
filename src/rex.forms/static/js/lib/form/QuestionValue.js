/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';

import QuestionLabel from './QuestionLabel';
import Help from './Help';
import AudioPlayer from './AudioPlayer';

import {
  defaultWidgetComponentConfig,
  defaultWidgetConfig,
  defaultViewWidgetConfig
} from './WidgetConfig';

export default function QuestionValue({
  formValue, question, instrument, readOnly,
  editable, onCommitEdit, onCancelEdit,
  noLabel, noHelp, noAudio, disabled, widgetProps, ...props
}) {

  let Widget;
  if (readOnly) {
    // Use the read-only widget for the given type.
    Widget = defaultViewWidgetConfig[instrument.type.base];
  } else {
    if (question.widget && question.widget.type) {
      // If a widget is specified, use it.
      Widget = defaultWidgetComponentConfig[question.widget.type];
    }
    if (!Widget) {
      // If the specified widget is not one we know, or they didn't specify
      // one, then use the default.
      Widget = defaultWidgetConfig[instrument.type.base];
    }
  }

  return (
    <ReactUI.Block {...props}>
      {question.text && !noLabel &&
        <QuestionLabel
          disabled={disabled}
          text={question.text}
          required={instrument.field.required}
          />}
      <Widget
        {...widgetProps}
        instrument={instrument}
        editable={editable}
        onCommitEdit={onCommitEdit}
        onCancelEdit={onCancelEdit}
        disabled={disabled}
        question={question}
        options={question.widget && question.widget.options || {}}
        formValue={formValue}
        readOnly={readOnly}
        />
      {question.help && !noHelp &&!readOnly &&
        <Help disabled={disabled}>
          {question.help}
        </Help>}
      {question.audio && !noAudio && !readOnly &&
        <ReactUI.Block marginTop="x-small">
          <AudioPlayer disabled={disabled} source={question.audio} />
        </ReactUI.Block>}
    </ReactUI.Block>
  );
}


