/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {Action} from 'rex-action';
import {Preloader} from 'rex-widget/ui';
import {Fetch, DataSet} from 'rex-widget/data';
import {DataTableBase} from 'rex-widget/datatable';
import {autobind} from 'rex-widget/lang';

import Title from './Title';
import prettyBytes from './prettyBytes';


function prettifyMart(mart) {
  let newMart = {...mart};
  newMart.id = newMart.code;
  newMart.pinned_pretty = newMart.pinned ? 'Yes' : 'No';
  newMart.size_pretty = prettyBytes(newMart.size);
  newMart.can_manage_pretty = newMart.can_manage ? 'Yes' : 'No';
  return newMart;
}

function prettifyColumn(column) {
  let newColumn = {...column};
  if (['pinned', 'size', 'can_manage'].indexOf(newColumn.valueKey[0]) > -1) {
    newColumn.valueKey[0] = newColumn.valueKey[0] + '_pretty';
  }
  return newColumn;
}


@Fetch(function ({marts, context}) {
  if (context.mart_definition) {
    marts = marts.params({definition: context.mart_definition});
  }
  return {marts};
})
export default class MartPick extends React.Component {
  static defaultProps = {
    icon: 'list'
  };

  @autobind
  onSelect(martId, mart) {
    this.props.onContext({
      mart: martId
    });
  }

  render() {
    let {title, onClose, fields} = this.props;
    let {marts} = this.props.fetched;
    let {mart_definition} = this.props.context;

    if (marts.updating) {
      return <Preloader />;
    }

    let data = DataSet.fromData(marts.data.marts.map(prettifyMart));

    let columns = fields.map(prettifyColumn);
    if (!mart_definition) {
      columns.unshift({
        valueKey: ['definition'],
        label: 'Definition'
      });
    }

    return (
      <Action
        noContentWrapper
        title={title}
        onClose={onClose}>
        <DataTableBase
          allowReselect
          data={data}
          columns={columns}
          onSelect={this.onSelect}
          />
      </Action>
    );
  }

  static renderTitle({title}, {mart, mart_definition}) {
    let subtitle = '';
    if (mart_definition) {
      subtitle = mart_definition;
    }
    subtitle += '#' + mart;

    return (
      <Title
        title={title}
        subtitle={subtitle}
        />
    );
  }
}

