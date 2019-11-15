/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";

import * as FormContext from "./FormContext";
import QuestionLabel from "./QuestionLabel";
import Help from "./Help";
import AudioPlayer from "./AudioPlayer";

import { resolveWidget } from "./WidgetConfig";

export default function QuestionValue(
  {
    formValue,
    question,
    instrument,
    form,
    readOnly,
    editable,
    onCommitEdit,
    onCancelEdit,
    noLabel,
    noHelp,
    noAudio,
    disabled,
    widgetProps,
    ...props
  },
  context,
) {
  const interactionType = readOnly ? "view" : "edit";
  const [Widget, options] = resolveWidget(
    context.widgetConfig,
    instrument,
    question,
    interactionType,
  );

  return (
    <ReactUI.Block {...props}>
      {question.text && !noLabel && (
        <QuestionLabel
          disabled={disabled}
          text={question.text}
          required={instrument.field.required}
        />
      )}
      <Widget
        {...widgetProps}
        instrument={instrument}
        form={form}
        editable={editable}
        onCommitEdit={onCommitEdit}
        onCancelEdit={onCancelEdit}
        disabled={disabled}
        question={question}
        options={options}
        formValue={formValue}
        readOnly={readOnly}
      />
      {question.help && !noHelp && !readOnly && (
        <Help disabled={disabled}>{question.help}</Help>
      )}
      {question.audio && !noAudio && !readOnly && (
        <ReactUI.Block marginTop="x-small">
          <AudioPlayer disabled={disabled} source={question.audio} />
        </ReactUI.Block>
      )}
    </ReactUI.Block>
  );
}

QuestionValue.contextTypes = FormContext.contextTypes;
