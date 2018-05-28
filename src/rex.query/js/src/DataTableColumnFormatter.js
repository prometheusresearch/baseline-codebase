/**
 * flow
 */

import * as React from 'react';
import {style} from 'react-stylesheet';

import {generateColorHashMemoized} from './generateColorHash';

export function cellRenderer({
  columnData: {query},
  cellData,
  dataKey,
}): ?string | React.Element<*> {
  if (cellData === null) {
    return nullCell; // eslint-disable-line no-use-before-define
  } else if (cellData === undefined) {
    return null;
  } else if (query.context.type) {
    const type = query.context.type;
    if (type.name === 'record' && typeof cellData === 'object' && cellData != null) {
      if (type.card === 'seq') {
        if (Array.isArray(cellData)) {
          return cellData.map(entity => formatEntity(type.entity, entity)).join(', ');
        } else {
          return String(cellData);
        }
      } else {
        return formatEntity(type.entity, cellData);
      }
    } else if (type.name === 'boolean') {
      if (cellData === true) {
        return <BooleanTrueCell>✓</BooleanTrueCell>;
      } else if (cellData === false) {
        return <BooleanFalseCell>✗</BooleanFalseCell>;
      } else {
        return null;
      }
    } else if (type.name === 'number') {
      return <NumberCell>{String(cellData)}</NumberCell>;
    } else if (type.name === 'date') {
      return <DateTimeCell>{cellData}</DateTimeCell>;
    } else if (type.name === 'time') {
      return <DateTimeCell>{cellData}</DateTimeCell>;
    } else if (type.name === 'datetime') {
      return <DateTimeCell>{cellData}</DateTimeCell>;
    } else if (type.name === 'enumeration') {
      return <EnumerationCell value={String(cellData)} />;
    } else if (type.name === 'time') {
      return String(cellData);
    } else if (type.name === 'datetime') {
      return String(cellData);
    } else if (type.name === 'json') {
      return formatJSON(cellData);
    } else {
      return String(cellData);
    }
  } else {
    return String(cellData);
  }
}

function formatJSON(data) {
  // TODO: click to show data in a modal?
  return <JSONCell>— JSON data —</JSONCell>;
}

function formatEntity(entityName, entity): ?string | React.Element<*> {
  if (typeof entity === 'string') {
    return entity;
  } else if (typeof entity === 'boolean') {
    return entity;
  } else if (typeof entity === 'number') {
    return entity;
  } else if (entity == null) {
    return entity;
  } else if ('title' in entity) {
    return (entity.title: any);
  } else if ('name' in entity) {
    return (entity.name: any);
  } else if ('code' in entity) {
    return (entity.code: any);
  } else if ('id' in entity) {
    return (entity.id: any);
  } else {
    return <JSONCell>{'{'}Record: {entityName}{'}'}</JSONCell>;
  }
}

const EnumerationCellRoot = style('div', {
  displayName: 'EnumerationCellRoot',
  base: {
    userSelect: 'none',
    textAlign: 'right',
  },
});

const EnumerationCellInner = style('span', {
  displayName: 'EnumerationCellInner',
  base: {
    color: 'white',
    padding: 5,
  },
});

function EnumerationCell({value}) {
  // We can use memoized version here as all possible values of all enum are
  // still "finite".
  const backgroundColor = generateColorHashMemoized(value);
  return (
    <EnumerationCellRoot>
      <EnumerationCellInner style={{backgroundColor}}>
        {value}
      </EnumerationCellInner>
    </EnumerationCellRoot>
  );
}

let NullCell = style('div', {
  base: {
    color: '#bbb',
    textAlign: 'center',
  },
});

let nullCell = <NullCell>—</NullCell>;

let NumberCell = style('div', {
  displayName: 'NumberCell',
  base: {
    textAlign: 'right',
    paddingRight: 5,
    paddingLeft: 5,
  },
});

let DateTimeCell = style('div', {
  displayName: 'DateTimeCell',
  base: {
    textAlign: 'right',
    paddingRight: 5,
    paddingLeft: 5,
  },
});

let BooleanTrueCell = style('div', {
  displayName: 'BooleanTrueCell',
  base: {
    textAlign: 'right',
    color: 'green',
    paddingRight: 5,
    paddingLeft: 5,
  },
});

let BooleanFalseCell = style('div', {
  displayName: 'BooleanFalseCell',
  base: {
    textAlign: 'right',
    color: '#a90000',
    paddingRight: 5,
    paddingLeft: 5,
  },
});

let JSONCell = style('div', {
  displayName: 'JSONCell',
  base: {
    color: '#888',
    fontFamily: 'Menlo, monospace',
    fontSize: '7pt',
  },
});
