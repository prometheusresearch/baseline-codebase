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

import * as t from '../model/Type';
import {getQueryNavigation} from '../model/QueryNavigation';
import Table from './datatable/DataTable';

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
      </AutoSizer>
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
    const type = column.query.context.type;
    const baseType = t.atom(type);
    if (baseType.name === 'entity' && typeof cellData === 'object' && cellData != null) {
      if (type.name === 'seq') {
        if (Array.isArray(cellData)) {
          cellData = cellData.map(entity =>
            formatEntity(baseType.entity, entity)).join(', ');
        }
      } else {
        if ('code' in cellData) {
          cellData = cellData.code;
        } else if ('name' in cellData) {
          cellData = cellData.name;
        } else if ('title' in cellData) {
          cellData = cellData.title;
        }
      }
    }
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

function formatEntity(entityName, entity) {
  if ('title' in entity) {
    return entity.title;
  } else if ('name' in entity) {
    return entity.name;
  } else if ('code' in entity) {
    return entity.code;
  } else {
    return entityName;
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

