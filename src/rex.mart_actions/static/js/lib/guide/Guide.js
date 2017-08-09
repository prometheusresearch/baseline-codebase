/**
 * @copyright 2017, Prometheus Research, LLC
 * @flow
 */

import * as Types from './types';

import React from 'react';

import * as ReactUI from '@prometheusresearch/react-ui';
import {css, VBox, HBox} from 'react-stylesheet';

import {Action} from 'rex-action';
import {Preloader} from 'rex-widget/ui';
import {withFetch, type Request, type DataSet} from 'rex-widget/data';

import martFromContext from '../martFromContext';
import ControlPanel from './ControlPanel';
import OutputPanel from './OutputPanel';

export class Guide extends React.Component {
  props: {
    context: Object,
    onClose: Function,
    text: string,
    allowedExporters: Array<Types.Exporter>,
    guideResults: Request,
    guideChartResults: Request,
    guideConfiguration: Request,
    previewRecordLimit: ?number,
    allowAdhocCharts?: boolean,
    charts: Array<{title: string, element: React.Element<*>}>,
    fetched: {
      guideConfiguration: DataSet<Types.Config>,
    },
  };

  state: {
    columnState: Types.ColumnState,
    filterState: Types.FilterState,
    sortState: Types.SortState,
  } = {
    columnState: [],
    filterState: [],
    sortState: [],
  };

  onControlUpdate = (columnState: Types.ColumnState, filterState: Types.FilterState) => {
    let sortState = this.state.sortState.filter(sort => {
      // $FlowFixMe: sort.id should be a number probably
      return columnState[sort.id];
    });
    this.setState({columnState, filterState, sortState});
  };

  onOutputUpdate = (sortState: Types.SortState) => {
    this.setState({sortState});
  };

  render() {
    let {
      context,
      onClose,
      fetched: {guideConfiguration: {data, updating}},
      text,
      allowedExporters,
      guideResults,
      guideChartResults,
      previewRecordLimit,
      allowAdhocCharts,
      charts,
    } = this.props;
    let {columnState, filterState, sortState} = this.state;

    let mart = martFromContext(context);
    // TODO: instead use guideResults directly
    let resultsUrl = guideResults.path + '?mart=' + mart;

    let content;
    if (updating || data == null) {
      content = (
        <HBox height="100%">
          <Preloader />;
        </HBox>
      );
    } else {
      content = (
        <HBox height="100%">
          <VBox
            style={{
              boxShadow: css.boxShadow(0, 0, 1, 2, '#E2E2E2'),
              flexBasis: 320,
              paddingLeft: 2,
            }}>
            <ControlPanel
              columns={data.fields}
              filters={data.filters}
              columnState={columnState}
              filterState={filterState}
              help={text}
              onUpdate={this.onControlUpdate}
            />
          </VBox>
          <VBox
            style={{
              flexGrow: 1,
              paddingLeft: 2,
            }}>
            <OutputPanel
              guideResults={guideResults.params({mart})}
              guideChartResults={guideChartResults.params({mart})}
              allowAdhocCharts={allowAdhocCharts}
              charts={charts}
              columns={data.fields}
              columnState={columnState}
              filterState={filterState}
              sortState={sortState}
              resultsUrl={resultsUrl}
              previewRecordLimit={previewRecordLimit}
              exporters={allowedExporters}
              onUpdate={this.onOutputUpdate}
            />
          </VBox>
        </HBox>
      );
    }

    return (
      <Action noContentWrapper noHeader onClose={onClose}>
        {content}
      </Action>
    );
  }
}

export default withFetch(Guide, function({guideConfiguration, entity, context}) {
  guideConfiguration = guideConfiguration.params({
    mart: martFromContext(context),
  });
  return {guideConfiguration};
});
