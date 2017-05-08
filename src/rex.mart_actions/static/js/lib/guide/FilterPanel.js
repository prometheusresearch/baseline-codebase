/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';

import * as ReactUI from '@prometheusresearch/react-ui';
import {VBox} from 'react-stylesheet';

import ScrollablePanel from './ScrollablePanel';
import {FILTER_MAP} from './filters';


export default class FilterPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
    props.filters.forEach((col, idx) => {
      this.state[idx] = [];
    });
    props.filterState.forEach((flt) => {
      this.state[flt.id].push(flt);
    });
  }

  onFilterUpdate(filter, params) {
    this.setState(
      {[filter]: params},
      () => {
        let filterState = [];
        this.props.filters.forEach((filter, idx) => {
          let param = this.state[idx];
          if (param && (param.length >= 1)) {
            Array.prototype.push.apply(filterState, param);
          }
        });
        this.props.onUpdate(filterState);
      }
    );

  }

  render() {
    let {filters} = this.props;

    return (
      <ScrollablePanel>
        {filters.map((filter, idx) => {
          let Filter = FILTER_MAP[filter.type];

          if (Filter) {
            return (
              <Filter
                key={idx}
                id={idx}
                config={filter}
                filterState={this.state[idx]}
                onUpdate={this.onFilterUpdate.bind(this, idx)}
                />
            );

          } else {
            return (
              <VBox
                style={{
                  padding: '10px 0',
                }}
                key={idx}>
                <ReactUI.ErrorText key={idx}>
                  Unknown filter type "{filter.type}" for "{filter.title}"
                </ReactUI.ErrorText>
              </VBox>
            );

          }

        })}
      </ScrollablePanel>
    );
  }
}

