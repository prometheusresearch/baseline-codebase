/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';

import * as ReactUI from '@prometheusresearch/react-ui';
import {style} from 'react-stylesheet';
import debounce from 'lodash/debounce';

import ScrollablePanel from './ScrollablePanel';


class ColumnCheckbox extends ReactUI.Checkbox {
  static stylesheet = {
    ...ReactUI.Checkbox.stylesheet,
    LabelWrapper: style(ReactUI.Checkbox.stylesheet.LabelWrapper, {
      base: {
        cursor: 'pointer',
        maxWidth: '90%',
      }
    })
  };
}


export default class ColumnPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
    if (props.columnState.length === 0) {
      props.columns.forEach((col, idx) => {
        this.state[idx] = col.selected || false;
      });
    } else {
      props.columnState.forEach((col, idx) => {
        this.state[idx] = col;
      });
    }

    this._onUpdate = debounce(() => {
      this.props.onUpdate(this.props.columns.map((col, idx) => {
        return this.state[idx];
      }));
    }, 750);
  }

  onColumnToggle(column) {
    let newStatus = !this.state[column];

    // Don't let them deselect everything.
    if (!newStatus) {
      let cnt = Object.keys(this.state).filter((idx) => {
        return this.state[idx];
      }).length;
      if (cnt <= 1) {
        return;
      }
    }

    this.setState(
      {[column]: newStatus},
      this._onUpdate,
    );
  }

  render() {
    let {columns} = this.props;

    return (
      <ScrollablePanel>
        {columns.map((col, idx) => {
          return (
            <div
              style={{
                padding: 10,
                cursor: 'pointer',
              }}
              onClick={this.onColumnToggle.bind(this, idx)}
              key={idx}>
              <ColumnCheckbox
                value={this.state[idx]}
                label={col.title}
                />
            </div>
          );
        })}
      </ScrollablePanel>
    );
  }
}

