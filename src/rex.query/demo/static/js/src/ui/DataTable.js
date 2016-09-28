/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryNavigation} from '../model/QueryNavigation';

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {VBox} from '@prometheusresearch/react-box';
import {style} from 'react-stylesheet';
import {AutoSizer} from 'react-virtualized';
import IconPlus from 'react-icons/lib/fa/plus';

import {getQueryNavigation} from '../model/QueryNavigation';
import Table from './datatable/DataTable';
import Message from './Message';

let styles = {};

function getColumnList(query) {
  return getColumnListFromNavigation(getQueryNavigation(query), false);
}

function returnRowData({rowData}) {
  return rowData;
}

function returnRowDataByPath({rowData, dataKey}) {
  return rowData != null ? rowData[dataKey] : null;
}

function getColumnListFromNavigation(nav: QueryNavigation, usePath) {
  if (nav.type === 'column') {
    if (nav.query.name === 'aggregate') {
      usePath = false;
    }
    return [
      {
        cellRenderer,
        query: nav.query,
        key: nav.path,
        dataKey: nav.path,
        cellDataGetter: usePath ? returnRowDataByPath : returnRowData,
        label: nav.title,
        width: 90
      }
    ];
  } else if (nav.type === 'select') {
    return nav.select
      .map(nav => getColumnListFromNavigation(nav, true))
      .reduce((list, c) => list.concat(c), []);
  } else if (nav.type === 'navigate') {
    if (nav.navigate.length === 0) {
      return [];
    } else {
      let navigate = nav.navigate.slice();
      let last = navigate.pop();
      return getColumnListFromNavigation(last, usePath || false);
    }
  }
}

type DataTableProps = {
  query: Query;
  data: Object;
  onAddColumn: () => *;
  fieldList: Array<string>;
};

export class DataTable extends React.Component<*, DataTableProps, *> {

  render() {
    let {query, onAddColumn, fieldList} = this.props;
    let columns = getColumnList(query);

    return (
      fieldList.length > 0 ?
        <AutoSizer>
          {size => (
            <Table
              onAddColumn={onAddColumn}
              headerHeight={40}
              noRowsRenderer={this._noRowsRenderer}
              overscanRowCount={10}
              rowHeight={35}
              rowGetter={this._getDatum}
              rowCount={this._getData().length}
              height={size.height}
              width={size.width}
              columns={columns}
              />
          )}
        </AutoSizer> :
        <NoColumnsMessage
          onAddColumn={onAddColumn}
          />
    )
  }

  _getData() {
    let {data, query} = this.props;
    let nav = getQueryNavigation(query);
    if (nav.type === 'navigate') {
      for (let i = nav.navigate.length - 1; i >= 0; i--) {
        if (nav.navigate[i].type === 'column') {
          data = data[nav.navigate[i].path];
          break;
        }
      }
    } else if (nav.type === 'select') {
      // TODO: handle record on the top level
    } else if (nav.type === 'column') {
      // TODO: handle scalar
    }
    return Array.isArray(data) ? data : [data];
  }

  _getDatum = ({index}: {index: number}) => {
    let data = this._getData();
    return data[index];
  };

  _noRowsRenderer = () => {
    return (
      <div className={styles.noRows}>
        No data
      </div>
    )
  };

}

function cellRenderer({
  cellData,
  dataKey,
  column,
}): ?string | React.Element<*> {
  if (cellData == null) {
    return ''
  } else if (column.query.context.type) {
    let type = column.query.context.type;
    if (type.name === 'boolean') {
      if (cellData === true) {
        return <BooleanTrueCell>✓</BooleanTrueCell>;
      } else if (cellData === false) {
        return <BooleanFalseCell>✗</BooleanFalseCell>;
      } else {
        return null;
      }
    } else if (type.name === 'number') {
      return String(cellData)
    } else {
      return String(cellData)
    }
  } else {
    return String(cellData)
  }
}

let BooleanTrueCell = style('div', {
  displayName: 'BooleanTrueCell',
  base: {
    textAlign: 'right',
    color: 'green',
    paddingRight: 5,
    paddingLeft: 5,
  }
});

let BooleanFalseCell = style('div', {
  displayName: 'BooleanFalseCell',
  base: {
    textAlign: 'right',
    color: '#a90000',
    paddingRight: 5,
    paddingLeft: 5,
  }
});

function NoColumnsMessage({onAddColumn}: {onAddColumn: () => *}) {
  return (
    <Message>
      No columns configured.
      Click
        <VBox paddingH={5} paddingV={5}>
          <ReactUI.Button
            icon={<IconPlus />}
            size="small"
            onClick={onAddColumn}>
            Configure columns
          </ReactUI.Button>
        </VBox>
      to add a few.
    </Message>
  );
}
