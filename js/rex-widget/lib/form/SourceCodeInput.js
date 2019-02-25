/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import 'codemirror/lib/codemirror.css';

import React from 'react';
import Codemirror from 'react-codemirror';

import {style} from '../../stylesheet';
import * as css from '../../css';


let Root = style('div', {
  Component: 'textarea',
  display: 'block',
  width: '100%',
  minHeight: 102,
  padding: 0,
  resize: 'vertical',
  fontSize: '12px',
  lineHeight: 1.42857143,
  color: '#000',
  backgroundColor: '#fff',
  backgroundImage: css.none,
  border: css.border(1, '#ccc'),
  borderRadius: 2,
  boxShadow: css.insetBoxShadow(0, 1, 1, css.rgba(0, 0,0 , 0.075)),
  transition: 'border-color ease-in-out .15s,box-shadow ease-in-out .15s',
  error: {
    border: css.border(1, 'red'),
  },
  focus: {
    border: css.border(1, '#888'),
    boxShadow: css.insetBoxShadow(0, 1, 1, css.rgba(0, 0,0 , 0.075)),
    outline: css.none,
  },
});


export default class SourceCodeInput extends React.Component {
  render() {
    return (
      <Root>
        <Codemirror
          {...this.props}
          ref={this.onCodeMirror}
          options={{lineNumbers: true}}
          />
      </Root>
    );
  }

  onCodeMirror = (codeMirror) => {
    if (codeMirror) {
      setTimeout(() => codeMirror.getCodeMirror().refresh(), 0);
    }
  };
}

