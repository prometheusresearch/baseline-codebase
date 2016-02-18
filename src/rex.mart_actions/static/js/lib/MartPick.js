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
    let {title, onClose} = this.props;
    let {marts} = this.props.fetched;
    let {mart_definition} = this.props.context;

    if (marts.updating) {
      return <Preloader />;
    }
    let data = DataSet.fromData(
      marts.data.map((mart) => {
        let newMart = {...mart};
        newMart.id = newMart.code;
        newMart.pinned_pretty = newMart.pinned ? 'Yes' : 'No';
        newMart.size_pretty = prettyBytes(newMart.size);
        return newMart;
      })
    );

    let columns = [
      {
        valueKey: ['date_creation_completed'],
        label: 'Date Created'
      },
      {
        valueKey: ['owner'],
        label: 'Owner'
      },
      {
        valueKey: ['pinned_pretty'],
        label: 'Pinned'
      },
      {
        valueKey: ['size_pretty'],
        label: 'Size'
      }
    ];
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

