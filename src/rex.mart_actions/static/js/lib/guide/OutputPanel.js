/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';

import {autobind} from 'rex-widget/lang';
import {TabContainer} from 'rex-query/src/ui';

import DownloadPanel from './DownloadPanel';
import PreviewPanel from './PreviewPanel';


export default class OutputPanel extends React.Component {
  constructor() {
    super();
    this.state = {
      activeTab: 'preview',
      sort: [],
    };
  }

  @autobind
  onSortChange(sortState) {
    this.props.onUpdate(sortState);
  }

  @autobind
  retrieveResults(mimeType, limit, offset) {
    let body = JSON.stringify({
      'columns': this.props.columnState
        .map((col, idx) => col ? idx : -1)
        .filter((col) => col >= 0),
      'filters': this.props.filterState,
      'sort': this.props.sortState,
      limit,
      offset,
    });

    let opts = {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': mimeType,
      },
      body,
    };

    return fetch(this.props.resultsUrl, opts);
  }

  render() {
    let {columnState, filterState, exporters} = this.props;
    let {activeTab, changeId} = this.state;

    let tabs = [
      {
        id: 'preview',
        label: 'Preview',
        children: (
          <PreviewPanel
            columnState={this.props.columnState}
            sortState={this.props.sortState}
            retriever={this.retrieveResults}
            previewRecordLimit={this.props.previewRecordLimit}
            onSortChange={this.onSortChange}
            />
        ),
      },
    ];

    if (exporters && (exporters.length > 0)) {
      tabs.push({
        id: 'export',
        label: 'Download',
        children: (
          <DownloadPanel
            retriever={this.retrieveResults}
            exporters={exporters}
            />
        ),
      });
    }

    return (
      <TabContainer
        activeTab={activeTab}
        onActiveTab={(activeTab) => {this.setState({activeTab})}}
        tabList={tabs}
        tabListAlt={[]}
        />
    );
  }
}

