/**
 * @flow
 */

import type {Query} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';
import type {onSelectCallback, onQueryCallback} from '../QueryBuilder';

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import {style} from 'react-stylesheet';
import IconRemove from 'react-icons/lib/fa/trash';
import IconCircleO from 'react-icons/lib/fa/circle-o'
import IconCircle from 'react-icons/lib/fa/circle'

import noop from '../noop';
import * as qp from '../model/QueryPointer';
import * as qo from '../model/QueryOperation';
import QueryVisToolbar from './QueryVisToolbar';

type QueryVisButtonProps = {
  label: string;
  pointer: QueryPointer<Query>;
  children?: React$Element<*>;
  selected: QueryPointer<Query>;
  onSelect: onSelectCallback;
  onQuery: onQueryCallback;
  stylesheet: {
    Root: typeof VBox;
    Button: typeof VBox;
  };
};

export default class QueryVisButton extends React.Component<*, QueryVisButtonProps, *> {

  state: {
    isActive: boolean;
    isHover: boolean;
  };

  static defaultProps = {
    selected: false,
    onSelect: noop,
    stylesheet: {
      Root: VBox,
      Button: VBox,
    }
  };

  onSelect = (e: UIEvent) => {
    e.stopPropagation();
    let {selected, onSelect, pointer} = this.props;
    let isSelected = qp.is(selected, pointer);
    if (isSelected) {
      onSelect(null);
    } else {
      onSelect(pointer);
    }
  };

  onRemove = (e: UIEvent) => {
    e.stopPropagation();
    let {pointer, selected, onQuery} = this.props;
    let {query, selected: nextSelected} = qo.removeAt(pointer, selected);
    onQuery(query, nextSelected);
  };

  toggleActive = (e: UIEvent) => {
    e.stopPropagation();
    let isActive = !this.state.isActive;
    this.setState({isActive});
  };

  onMouseEnter = () => {
    this.setState({isHover: true});
  };

  onMouseLeave = () => {
    this.setState({isHover: false});
  };

  constructor(props: QueryVisButtonProps) {
    super(props);
    this.state = {
      isActive: true,
      isHover: false,
    };
  }

  render() {
    let {
      label, children, selected, pointer, onQuery,
      stylesheet: {Root, Button},
    } = this.props;
    let {
      isActive, isHover
    } = this.state;
    let isSelected = qp.is(selected, pointer);
    return (
      <VBox>
        <Root
          variant={{selected: isSelected}}
          onClick={this.onSelect}
          onMouseOver={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}>
          <QueryVisButtonLabel>
            <HBox grow={1} alignItems="center">
              <VBox
                paddingRight={5}
                style={{visibility: !isActive || isSelected || isHover ? 'visible' : 'hidden'}}>
                <Button disableActive onClick={this.toggleActive}>
                  {isActive ? <IconCircle /> : <IconCircleO />}
                </Button>
              </VBox>
              <VBox grow={1}>{label}</VBox>
              <HBox style={{visibility: isSelected || isHover ? 'visible' : 'hidden'}}>
                <Button onClick={this.onRemove}>
                  <IconRemove />
                </Button>
              </HBox>
            </HBox>
          </QueryVisButtonLabel>
          {isSelected &&
            <Root
              position="absolute"
              top={0}
              right={-6}
              width={6}
              grow={1}
              />}
        </Root>
        {children &&
          <VBox marginLeft={20}>
            {children}
          </VBox>}
        {isSelected &&
          <VBox padding={5} paddingBottom={0}>
            <QueryVisToolbar
              pointer={pointer}
              selected={selected}
              onQuery={onQuery}
              />
          </VBox>}
      </VBox>
    );
  }

}

export let QueryVisButtonLabel = style(HBox, {
  displayName: 'QueryVisButtonLabel',
  base: {
    userSelect: 'none',
    cursor: 'default',
    fontSize: '8pt',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    padding: 5,
    width: '100%',
  }
});
