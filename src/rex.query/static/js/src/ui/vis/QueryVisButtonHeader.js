/**
 * @flow
 */

import React from 'react';
import {VBox, HBox} from '@prometheusresearch/react-box';
import {style} from 'react-stylesheet';
import IconRemove from 'react-icons/lib/fa/trash';
import IconCircleO from 'react-icons/lib/fa/circle-o'
import IconCircle from 'react-icons/lib/fa/circle'

type QueryVisButtonHeaderProps = {
  stylesheet: {
    Root: typeof VBox;
    Button: typeof VBox;
  };
  closeIcon: React.Element<*>;

  label: string;

  selected: boolean;
  selectable: boolean;

  toggleable: boolean;
  closeable: boolean;

  closeTitle?: string;

  onSelect: () => void;
  onClose: () => void;
};

export default class QueryVisButtonHeader
  extends React.Component<*, QueryVisButtonHeaderProps, *> {

  state: {
    active: boolean;
    hover: boolean;
  };

  state = {
    active: true,
    hover: false,
  };

  static defaultProps = {
    closeIcon: <IconRemove />,
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

  onClose = (e: UIEvent) => {
    e.stopPropagation();
    this.props.onClose();
  };

  render() {
    let {
      label, selected,
      selectable, toggleable, closeable,
      closeIcon, closeTitle,
      first, last,
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
            style={{
              visibility: toggleable && (!active || selected || hover)
                ? 'visible'
                : 'hidden'
            }}>
            <Button disableActive onClick={toggleable && this.toggleActive}>
              {active ? <IconCircle /> : <IconCircleO />}
            </Button>
          </VBox>
          <VBox grow={1}>{label}</VBox>
          {closeable &&
            <HBox
              style={{visibility: selected || hover ? 'visible' : 'hidden'}}>
              <Button onClick={this.onClose} title={closeTitle}>
                {closeIcon}
              </Button>
            </HBox>}
        </HBox>
      </QueryVisButtonLabel>
    );

    return (
      <Root
        first={first}
        last={last}
        variant={{selected}}
        onClick={selectable && this.onSelect}
        onMouseOver={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}>
        {buttonLabel}
      </Root>
    );
  }
}

export let QueryVisButtonLabel = style(HBox, {
  displayName: 'QueryVisButtonLabel',
  base: {
    textTransform: 'capitalize',
    userSelect: 'none',
    cursor: 'default',
    fontSize: '9pt',
    fontWeight: 400,
    padding: 6,
    width: '100%',
    height: 32,
  }
});
