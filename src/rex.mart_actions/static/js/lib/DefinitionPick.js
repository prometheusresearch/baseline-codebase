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


@Fetch(function ({definitions}) {
  return {definitions};
})
export default class DefinitionPick extends React.Component {
  static defaultProps = {
    icon: 'list'
  };

  @autobind
  onSelect(definitionId, definition) {
    this.props.onContext({
      mart_definition: definitionId
    });
  }

  render() {
    let {title, onClose} = this.props;
    let {definitions} = this.props.fetched;

    if (definitions.updating) {
      return <Preloader />;
    }
    let data = DataSet.fromData(definitions.data);

    let columns = [
      {
        valueKey: ['label'],
        label: 'Name'
      },
      {
        valueKey: ['description'],
        label: 'Description'
      },
      {
        valueKey: ['num_marts'],
        label: '# Marts'
      }
    ];

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

  static renderTitle({title}, {mart_definition}) {
    return (
      <Title
        title={title}
        subtitle={mart_definition}
        />
    );
  }
}

