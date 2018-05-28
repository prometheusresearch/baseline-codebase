/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';

import {InjectI18N} from 'rex-i18n';


function HeaderColumn({label, hint, width}) {
  return (
    <th title={hint} style={{width, textAlign: 'left'}}>
      <ReactUI.Block paddingH="small" paddingV="x-small">
        {label}
      </ReactUI.Block>
    </th>
  );
}


@InjectI18N
export default class Header extends React.Component {
  render() {
    let {entries} = this.props;
    let width = `${100 / (entries.length + 1)}%`;
    let columns = entries
      .map(entry =>
        <HeaderColumn
          key={entry.uid}
          label={entry.uid}
          width={width}
          hint={this._('Entered By: %(username)s', {username: entry.modified_by})}
          />
      )
      .concat(
        <HeaderColumn
          key="_final_value"
          label={this._('Final Value')}
          />
      );

    return (
      <thead>
        <tr>
          {columns}
        </tr>
      </thead>
    );
  }
}

