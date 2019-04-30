/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {emptyFunction} from 'rex-widget/lang';
import {VBox, HBox} from '@prometheusresearch/react-box';
import * as stylesheet from 'rex-widget/Stylesheet';
import * as css from 'rex-widget/CSS';

let style = stylesheet.create({
  Root: {
    Component: HBox,
    flex: 1,
    cursor: css.cursor.pointer,
    padding: css.padding(5, 7),
    alignItems: 'center',
    hover: {
      background: '#EEE'
    }
  },
  Check: {
    marginRight: '5px',
    lineHeight: '90%'
  },
  Label: {
    Component: VBox,
    flex: 1,
    fontSize: '90%',
  }
});

export default class CheckboxButton extends React.Component {

  render() {
    let {value, label} = this.props;
    return (
      <style.Root  onClick={this.onClick}>
        <style.Check>
          <input type="checkbox" checked={value} onChange={emptyFunction} />
        </style.Check>
        <style.Label>{label}</style.Label>
      </style.Root>
    );
  }

  onClick = () => {
    let {value, onChange, name} = this.props;
    onChange(!value, name);
  }
}

