/**
 * @copyright 2017, Prometheus Research, LLC
 * @flow
 */

import * as Types from './types';

import invariant from 'invariant';
import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';

import type {Request} from 'rex-widget/data';
import {AddChartDialogue} from 'rex-query/charting';

import DownloadPanel from './DownloadPanel';
import PreviewPanel from './PreviewPanel';
import Chart from './Chart';
import fetchResults from './fetchResults';

export type OutputPanelProps = {
  guideResults: Request,
  guideChartResults: Request,
  columnState: Types.ColumnState,
  sortState: Types.SortState,
  filterState: Types.FilterState,

  resultsUrl: string,
  exporters: Array<Types.Exporter>,
  columns: Array<Types.ColumnSpec>,

  allowAdhocCharts?: boolean,
  charts: Array<{title: string, element: React.Element<*>}>,
  previewRecordLimit?: ?number,

  onUpdate: Types.SortState => *,
};

type OutputPanelState = {
  activeTab: string,
  sort: Array<string>,
  chartList: Array<Types.ChartSpec>,
};

const MIMETYPE_APPLICATION_JSON = 'application/json';

export default class OutputPanel extends React.Component {
  props: OutputPanelProps;

  state: OutputPanelState = {
    activeTab: 'preview',
    sort: [],
    chartList: [],
  };

  onSortChange = (sortState: any) => {
    this.props.onUpdate(sortState);
  };

  onActiveTab = (activeTab: string) => {
    this.setState({activeTab});
  };

  retriever = (params?: $Shape<Types.FetchResultsParams> = {}) => {
    params = {
      columnState: this.props.columnState,
      filterState: this.props.filterState,
      sortState: this.props.sortState,
      limit: undefined,
      offset: undefined,
      mimeType: MIMETYPE_APPLICATION_JSON,
      ...params,
    };
    return fetchResults(this.props.resultsUrl, params);
  };

  retrieveResults = (mimeType: string, limit?: number, offset?: number) => {
    return this.retriever({
      limit,
      offset,
      mimeType,
    });
  };

  onAddChart = (params: {chartType: Types.ChartType}) => {
    const {chartType} = params;
    this.setState(state => {
      const chartSpec = {
        id: `${chartType}-${this.state.chartList.length + 1}`,
        label: null,
        chart: getInitialChart({type: chartType}),
      };
      const chartList = state.chartList.concat(chartSpec);
      return {
        ...state,
        activeTab: chartSpec.id,
        chartList,
      };
    });
  };

  onRemoveChart = (chartSpec: Types.ChartSpec) => {
    this.setState(state => {
      const chartList = state.chartList.filter(s => s.id !== chartSpec.id);
      return {...state, chartList, activeTab: 'preview'};
    });
  };

  onUpdateChart = (chartSpec: Types.ChartSpec, chart: Types.Chart) => {
    this.setState(state => {
      const chartList = state.chartList.map(s => {
        if (s.id === chartSpec.id) {
          return {...s, chart};
        } else {
          return s;
        }
      });
      return {...state, chartList};
    });
  };

  onUpdateLabel = (chartSpec: Types.ChartSpec, label: string) => {
    this.setState(state => {
      const chartList = state.chartList.map(s => {
        if (s.id === chartSpec.id) {
          return {...s, label};
        } else {
          return s;
        }
      });
      return {...state, chartList};
    });
  };

  render() {
    const {
      charts,
      allowAdhocCharts,
      columns,
      columnState,
      exporters,
      guideChartResults,
    } = this.props;
    const {chartList, activeTab} = this.state;

    const tabs = [
      {
        id: 'preview',
        label: 'Preview',
        children: (
          <PreviewPanel
            columnState={columnState}
            sortState={this.props.sortState}
            retriever={this.retrieveResults}
            previewRecordLimit={this.props.previewRecordLimit}
            onSortChange={this.onSortChange}
          />
        ),
      },
    ]
      .concat(
        charts.map((chart, index) => ({
          id: `predefined-chart-${index}`,
          label: chart.title || 'Chart',
          children: React.cloneElement(chart.element, {
            data: guideChartResults.params({index}),
            filterState: this.props.filterState,
          }),
        })),
      )
      .concat(
        chartList.map(chartSpec => ({
          id: chartSpec.id,
          label: chartSpec.label || 'Chart',
          children: (
            <Chart
              resultsUrl={this.props.resultsUrl}
              columns={columns}
              chartSpec={chartSpec}
              onRemoveChart={this.onRemoveChart}
              onUpdateChart={this.onUpdateChart}
              onUpdateLabel={this.onUpdateLabel}
              columnState={this.props.columnState}
              filterState={this.props.filterState}
              sortState={this.props.sortState}
            />
          ),
        })),
      );

    const tabListAlt = [
      exporters && exporters.length > 0
        ? {
            id: 'export',
            label: '⇓ Download',
            children: (
              <DownloadPanel retriever={this.retrieveResults} exporters={exporters} />
            ),
          }
        : null,
      allowAdhocCharts && {
        id: 'add-chart',
        label: '＋ Add Chart',
        children: <AddChartDialogue onAddChart={this.onAddChart} />,
      },
    ];

    return (
      <ReactUI.TabContainer
        activeTab={activeTab}
        onActiveTab={this.onActiveTab}
        tabList={tabs}
        tabListAlt={tabListAlt}
      />
    );
  }
}

function getInitialChart({type}: {type: string}): Types.Chart {
  switch (type) {
    case 'pie':
      return {
        type: 'pie',
        labelColumn: null,
        valueColumn: null,
        color: {},
      };
    case 'line':
      return {type: 'line', labelColumn: null, lineList: []};
    case 'area':
      return {type: 'area', labelColumn: null, areaList: []};
    case 'bar':
      return {
        type: 'bar',
        labelColumn: null,
        stacked: 'horizontal',
        barList: [],
      };
    case 'scatter':
      return {type: 'scatter', xColumn: null, yColumn: null, xLabel: null, yLabel: null};
    default:
      invariant(false, 'Unknown chart type: %s', type);
  }
}
