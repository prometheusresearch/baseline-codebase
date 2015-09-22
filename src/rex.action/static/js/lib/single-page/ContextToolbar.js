/**
 * @copyright 2015, Prometheus Research, LLC
 */

import ReactStylesheet  from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}     from '@prometheusresearch/react-box';
import React            from 'react';
import {renderTitle}    from '../actions';
import ActionButton     from './ActionButton';

@ReactStylesheet
export default class ContextToolbar extends React.Component {

  static stylesheet = {
    Self: {
      background: 'white',
      Component: VBox,
      boxShadow: '0px 2px 3px -1px #E2E2E2',
      marginBottom: 10,
      paddingBottom: 10,
      paddingTop: 10,
    },
    Button: {
      Component: ActionButton,
      Self: {
        width: '100%',
        background: 'white',
        borderBottom: '1px solid #f1f1f1',
        firstChild: {
          borderTop: '1px solid #f1f1f1',
        },
        hover: {
          background: '#f1f1f1',
        }
      }
    }
  };

  render() {
    let {execution, wizard, onClick} = this.props;
    let {Self, Button} = this.stylesheet;
    let buttons = execution.trace.slice(1, -1).map(position =>
      <Button
        showContext
        onClick={onClick}
        position={position}
        key={position.keyPath}
        />
    );
    return <Self>{buttons}</Self>;
  }
}

