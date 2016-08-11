/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as ReactForms from 'react-forms/reactive';
import some from 'lodash/some';

import * as FormContext from '../FormContext';
import Help from '../Help';
import QuestionLabel from '../QuestionLabel';
import QuestionValue from '../QuestionValue';
import AudioPlayer from '../AudioPlayer';
import ErrorList from '../ErrorList';


export default function Matrix({question, instrument, formValue, readOnly}) {
  return (
    <ReactUI.Block paddingTop="small">
      <table style={{width: '100%'}}>
        <thead>
          <ColumnLabelRow
            columns={question.questions}
            instrument={instrument.type.columns}
            readOnly={readOnly}
            />
        </thead>
        <tbody>
        {question.rows.map(row =>
          <MatrixRow
            key={row.id}
            row={row}
            readOnly={readOnly}
            formValue={formValue.select(row.id)}
            questions={question.questions}
            />)}
        </tbody>
      </table>
    </ReactUI.Block>
  );
}


function ColumnLabelRow({columns, readOnly}) {
  let rowLabelWidth = 0.15;
  let columnWidth = (1 - rowLabelWidth) / columns.length;

  return (
    <tr>
      <td style={{width: (rowLabelWidth * 100)+'%'}}></td>
      {columns.map((column) => {
        let style = {
          width: (columnWidth * 100) + '%',
          verticalAlign: 'top'
        };
        return (
          <td key={column.fieldId} style={style}>
            <QuestionLabel
              text={column.text}
              />
            {column.help && !readOnly &&
              <Help>{column.help}</Help>
            }
            {column.audio && !readOnly &&
              <ReactUI.Block marginTop="x-small">
                <AudioPlayer source={column.audio} />
              </ReactUI.Block>
            }
          </td>
        );
      })}
    </tr>
  );
}


@ReactForms.reactive
class MatrixRow extends React.Component {

  static contextTypes = FormContext.contextTypes;
  static childContextTypes = FormContext.contextTypes;

  constructor(props, context) {
    super(props, context);
    this.event = context.event.select(props.formValue.keyPath);
  }

  getChildContext() {
    return {
      ...this.context,
      event: this.event,
    };
  }

  render() {
    let {row, questions, formValue, readOnly} = this.props;
    let hasError = formValue.completeErrorList.length > 0;
    let showErrorList = (
      formValue.params.forceShowErrorList ||
      some(formValue.completeErrorList, error => error.force)
    );
    return (
      <tr>
        <td>
          <RowLabel
            text={row.text}
            help={readOnly ? null : row.help}
            audio={readOnly ? null : row.audio}
            required={formValue.schema.instrument.required}
            />
          {hasError && showErrorList &&
            <ErrorList formValue={formValue} />
          }
        </td>
        {questions.map(question => {
          let columnFormValue = formValue.select(question.fieldId);
          let {eventKey} = columnFormValue.schema.form;
          // override width of widget.options if any
          question = {
            widget: {
              options: {
                width: 'large',
                ...(question.widget && question.widget.options),
              },
              ...question.widget,
            },
            ...question
          };

        let {help, ...questionOptions} = question;  // eslint-disable-line no-unused-vars
          return (
            <td key={question.fieldId}>
              {!this.event.isHidden(eventKey) &&
                <QuestionValue
                  padding="small"
                  noLabel
                  noAudio
                  plain
                  disabled={this.event.isDisabled(eventKey)}
                  question={questionOptions}
                  instrument={columnFormValue.schema.instrument}
                  form={columnFormValue.schema.form}
                  formValue={columnFormValue.select('value')}
                  readOnly={readOnly}
                  />
              }
            </td>
          );
        })}
      </tr>
    );
  }
}

function RowLabel({required, text, help, audio, ...props}) {
  return (
    <ReactUI.Block {...props}>
      <QuestionLabel text={text} required={required} />
      {help && <Help>{help}</Help>}
      {audio && <AudioPlayer source={audio} />}
    </ReactUI.Block>
  );
}

