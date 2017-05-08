/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';

import * as ReactUI from '@prometheusresearch/react-ui';
import {css, VBox, HBox} from 'react-stylesheet';

import {Action} from 'rex-action';
import {Preloader} from 'rex-widget/ui';
import {Fetch} from 'rex-widget/data';
import {autobind} from 'rex-widget/lang';

import martFromContext from '../martFromContext';
import ControlPanel from './ControlPanel';
import OutputPanel from './OutputPanel';


@Fetch(function ({guideConfiguration, entity, context}) {
  guideConfiguration = guideConfiguration.params({
    'mart': martFromContext(context),
  });
  return {guideConfiguration};
})
export default class Guide extends React.Component {
  constructor() {
    super();
    this.state = {
      columnState: [],
      filterState: [],
      sortState: [],
    };
  }

  @autobind
  onControlUpdate(columnState, filterState) {
    let sortState = this.state.sortState.filter((sort) => {
      return columnState[sort.id];
    });
    this.setState({columnState, filterState, sortState});
  }

  @autobind
  onOutputUpdate(sortState) {
    this.setState({sortState});
  }

  render() {
    let {
      context,
      onClose,
      fetched,
      text,
      allowedExporters,
      guideResults,
      previewRecordLimit,
    } = this.props;
    let {columnState, filterState, sortState} = this.state;

    let mart = martFromContext(context);
    let resultsUrl = guideResults.path + '?mart=' + mart;

    let content;
    if (fetched.guideConfiguration.updating) {
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
              columns={fetched.guideConfiguration.data.fields}
              filters={fetched.guideConfiguration.data.filters}
              columnState={columnState}
              filterState={filterState}
              help={text}
              onUpdate={this.onControlUpdate}
              />
          </VBox>
          <VBox style={{
              flexGrow: 1,
              paddingLeft: 2,
            }}>
            <OutputPanel
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

