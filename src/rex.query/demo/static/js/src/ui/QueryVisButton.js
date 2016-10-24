/**
 * @flow
 */

import type {Query, QueryPointer} from '../model';
import type {Actions} from '../state';

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import {style} from 'react-stylesheet';
import IconRemove from 'react-icons/lib/fa/trash';
import IconCircleO from 'react-icons/lib/fa/circle-o'
import IconCircle from 'react-icons/lib/fa/circle'

import * as qp from '../model/QueryPointer';
import QueryVisToolbar from './QueryVisToolbar';

type QueryVisButtonProps = {
  pointer: QueryPointer<Query>;
  children?: React$Element<*>;
  selected: ?QueryPointer<Query>;
  disableToolbar: boolean;
};

export default class QueryVisButton extends React.Component<*, QueryVisButtonProps, *> {

  context: {
    actions: Actions;
  };

  static contextTypes = {actions: React.PropTypes.object};

  static defaultProps = {
    selected: null,
    disableToolbar: false,
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
    let {children, selected, pointer, disableToolbar, ...props} = this.props;
    let isSelected = qp.is(selected, pointer);
    return (
      <VBox>
        <QueryVisButtonHeader
          {...props}
          onSelect={this.onSelect}
          onRemove={this.onRemove}
          selected={isSelected}
          />
        {children &&
          <VBox marginLeft={20}>
            {children}
          </VBox>}
        {!disableToolbar && isSelected &&
          <VBox padding={5} paddingBottom={0}>
            <QueryVisToolbar
              pointer={pointer}
              selected={selected}
              />
          </VBox>}
      </VBox>
    );
  }

}

type QueryVisButtonHeaderProps = {
  stylesheet: {
    Root: typeof VBox;
    Button: typeof VBox;
  };
  label: string;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  disableRemove: boolean;
};

class QueryVisButtonHeader extends React.Component<*, QueryVisButtonHeaderProps, *> {

  state: {
    active: boolean;
    hover: boolean;
  };

  state = {
    active: true,
    hover: false,
  };

  onMouseEnter = () => {
    this.setState({hover: true});
  };

  onMouseLeave = () => {
    this.setState({hover: false});
  };

  toggleActive = (e: UIEvent) => {
    e.stopPropagation();
    let active = !this.state.active;
    this.setState({active});
  };

  onSelect = (e: UIEvent) => {
    e.stopPropagation();
    this.props.onSelect();
  };

  onRemove = (e: UIEvent) => {
    e.stopPropagation();
    this.props.onRemove();
  };

  render() {
    let {
      label, selected, disableRemove,
      stylesheet: {Root, Button},
    } = this.props;
    let {
      active, hover
    } = this.state;

    let buttonLabel = (
      <QueryVisButtonLabel>
        <HBox grow={1} alignItems="center">
          <VBox
            paddingRight={5}
            style={{visibility: !active || selected || hover ? 'visible' : 'hidden'}}>
            <Button disableActive onClick={this.toggleActive}>
              {active ? <IconCircle /> : <IconCircleO />}
            </Button>
          </VBox>
          <VBox grow={1}>{label}</VBox>
          {!disableRemove &&
            <HBox
              style={{visibility: selected || hover ? 'visible' : 'hidden'}}>
              <Button onClick={this.onRemove}>
                <IconRemove />
              </Button>
            </HBox>}
        </HBox>
      </QueryVisButtonLabel>
    );

    let stripe = selected && (
      <Root
        position="absolute"
        top={0}
        right={-6}
        width={6}
        grow={1}
        />
    );

    return (
      <Root
        variant={{selected}}
        onClick={this.onSelect}
        onMouseOver={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}>
        {buttonLabel}
        {stripe}
      </Root>
    );
  }
}

export let QueryVisButtonLabel = style(HBox, {
  displayName: 'QueryVisButtonLabel',
  base: {
    userSelect: 'none',
    cursor: 'default',
    fontSize: '9pt',
    fontWeight: 400,
    padding: 6,
    width: '100%',
  }
});
