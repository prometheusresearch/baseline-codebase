/**
 * @flow
 */

import type {Query, QueryPointer} from '../../model';
import type {Actions} from '../../state';

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';

import * as qp from '../../model/QueryPointer';
import QueryVisToolbar from './QueryVisToolbar';
import QueryVisButtonHeader from './QueryVisButtonHeader';

type QueryVisButtonProps = {

  /**
   * Pointer to the query.
   */
  pointer: QueryPointer<>;

  children?: React$Element<*>;

  /**
   * Currentluy selected query.
   */
  selected: ?QueryPointer<Query>;

  /**
   * Force selection state.
   */
  isSelected: boolean;

  /**
   * Disable selected state.
   */
  disableSelected: boolean;

  /**
   * Disable toggling enable/disable state
   */
  disableToggle: boolean;

  /**
   * Do not render toolbar.
   */
  disableToolbar: boolean;

};

export default class QueryVisButton extends React.Component<*, QueryVisButtonProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {
    actions: React.PropTypes.object
  };

  static defaultProps = {
    selected: null,
    isSelected: false,
    disableToolbar: false,
    disableSelected: false,
    stylesheet: {
      Root: VBox,
      Button: VBox,
    }
  };

  onSelect = () => {
    this.context.actions.select(this.props.pointer);
  };

  onRemove = () => {
    this.context.actions.remove(this.props.pointer);
  };

  render() {
    let {
      children,
      selected, pointer,
      disableToolbar,
      disableSelected,
      isSelected, ...props
    } = this.props;
    isSelected = isSelected || qp.is(selected, pointer);
    return (
      <VBox>
        <QueryVisButtonHeader
          {...props}
          onSelect={this.onSelect}
          onRemove={this.onRemove}
          selected={!disableSelected && isSelected}
          />
        {children}
        {!disableToolbar && isSelected &&
          <VBox padding={5} paddingBottom={0}>
            <QueryVisToolbar
              pointer={pointer}
              />
          </VBox>}
      </VBox>
    );
  }

}
