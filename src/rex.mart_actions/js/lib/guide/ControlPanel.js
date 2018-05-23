/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';

import {autobind} from 'rex-widget/lang';

import ColumnPanel from './ColumnPanel';
import FilterPanel from './FilterPanel';
import HelpPanel from './HelpPanel';

export default class ControlPanel extends React.Component {
  constructor() {
    super();
    this.state = {
      activeTab: 'columns',
      columnState: [],
      filterState: [],
    };
  }

  @autobind
  onColumnUpdate(columnState) {
    this.setState({columnState}, () => {
      this.props.onUpdate(this.state.columnState, this.state.filterState);
    });
  }

  @autobind
  onFilterUpdate(filterState) {
    this.setState({filterState}, () => {
      this.props.onUpdate(this.state.columnState, this.state.filterState);
    });
  }

  render() {
    let {columns, filters, columnState, filterState, help} = this.props;
    let {activeTab} = this.state;

    let tabs = [
      {
        id: 'columns',
        label: 'Columns',
        children: (
          <ColumnPanel
            columns={columns}
            columnState={columnState}
            onUpdate={this.onColumnUpdate}
          />
        ),
      },
    ];

    if (filters && filters.length > 0) {
      tabs.push({
        id: 'filters',
        label: 'Filters',
        children: (
          <FilterPanel
            filters={filters}
            filterState={filterState}
            onUpdate={this.onFilterUpdate}
          />
        ),
      });
    }

    if (help) {
      tabs.push({
        id: 'help',
        label: 'Help',
        children: <HelpPanel text={help} />,
      });
    }

    return (
      <ReactUI.TabContainer
        activeTab={activeTab}
        onActiveTab={activeTab => {
          this.setState({activeTab});
        }}
        tabList={tabs}
      />
    );
  }
}
