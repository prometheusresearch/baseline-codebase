/**
 * @copyright 2017-present, Prometheus Research, LLC
 */

import * as React from 'react';

import get from 'lodash/get';
import {Widget} from 'rex-forms';


const parseValue = v => {
  if (v == null) {
    v = '';
  }
  const [y, m, d] = v.split('-');
  return [y || '', m || '', d || ''];
};


/**
 * Define a custom input and a corresponding widget.
 */

function CustomDateTimeInput({value, onChange, disabled}) {
  const [y, m, d] = parseValue(value);
  const onYChange = e => onChange(`${e.target.value}-${m}-${d}`);
  const onMChange = e => onChange(`${y}-${e.target.value}-${d}`);
  const onDChange = e => onChange(`${y}-${m}-${e.target.value}`);
  return (
    <div>
      <input disabled={disabled} value={y} onChange={onYChange} />
      <input disabled={disabled} value={m} onChange={onMChange} />
      <input disabled={disabled} value={d} onChange={onDChange} />
    </div>
  );
}

/**
 * Define a custom read only view.
 */

function CustomDateTimeReadOnly({value}) {
  const [y, m, d] = parseValue(value);
  return (
    <div>
      <div>Year: {y}</div>
      <div>Month: {m}</div>
      <div>Day: {d}</div>
    </div>
  );
}

function CustomDateTime(props) {
  return (
    <Widget {...props}>
      {props.readOnly ? <CustomDateTimeReadOnly /> : <CustomDateTimeInput />}
    </Widget>
  );
}

function CustomMatrixEditor(props) {
  const {value = {}} = props;

  const onChange = (rowId, colId) => (e) => {
    const nextValue = {
      ...value,
      [rowId]: {
        ...value[rowId],
        [colId]: {value: e.target.value}
      }
    };
    props.onChange(nextValue);
  };

  const row1_col1 = get(value, 'row1.col1.value', '');
  const row1_col2 = get(value, 'row1.col2.value', '');
  const row2_col1 = get(value, 'row2.col1.value', '');
  const row2_col2 = get(value, 'row2.col2.value', '');

  return (
    <div>
      <div>
        <input value={row1_col1} onChange={onChange('row1', 'col1')} />
        <input value={row1_col2} onChange={onChange('row1', 'col2')} />
      </div>
      <div>
        <input value={row2_col1} onChange={onChange('row2', 'col1')} />
        <input value={row2_col2} onChange={onChange('row2', 'col2')} />
      </div>
    </div>
  );
}

function CustomMatrixView(props) {
  return <pre>{JSON.stringify(props.value, null, 2)}</pre>;
}

function CustomMatrix(props) {
  return (
    <Widget {...props}>
      {props.readOnly ? <CustomMatrixView /> : <CustomMatrixEditor />}
    </Widget>
  );
}

/**
 * Create a widget config which registers <CustomDateTime /> under
 * `customDateTime` widget type. Later in RIOS form config you can use:
 *
 *     widget:
 *       type: customDateTime
 *
 * To make question use this widget.
 */

const widgetConfig = {
  customDateTime: CustomDateTime,
  customMatrix: CustomMatrix,
};

export default function CustomWidgetDemo({Form, ...props}) {
  return (
    <Form
      {...props}
      widgetConfig={widgetConfig}
      />
  );
}

